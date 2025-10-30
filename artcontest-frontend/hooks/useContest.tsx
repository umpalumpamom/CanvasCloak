'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import type { Eip1193Provider } from 'ethers';
import { useFhevm } from '../fhevm/useFhevm';
import { FhevmDecryptionSignature } from '../fhevm/FhevmDecryptionSignature';
import { decryptValue, batchDecrypt } from '../fhevm/internal/decryption';
import { ContractEntry, DecryptedEntry, CategoryVotes } from '../fhevm/fhevmTypes';
import { ArtContestABI } from '../abi/ArtContestABI';
import { getArtContestAddress } from '../abi/ArtContestAddresses';

export function useContest() {
  const { fhevm, chainId } = useFhevm();
  const [isLoading, setIsLoading] = useState(false);

  // 获取合约实例
  const getContract = useCallback(async () => {
    if (!chainId) throw new Error('链 ID 未获取');
    if (!window || !window.ethereum) throw new Error('未检测到以太坊钱包');
    
    const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
    const signer = await provider.getSigner();
    const contractAddress = getArtContestAddress(chainId);
    
    return {
      contract: new ethers.Contract(contractAddress, ArtContestABI, signer),
      contractAddress,
      signer,
    };
  }, [chainId]);

  // 提交参赛作品
  const submitEntry = useCallback(async (
    title: string,
    descriptionHash: string,
    fileHash: string,
    tags: string[],
    categories: string[]
  ) => {
    setIsLoading(true);
    try {
      const { contract } = await getContract();
      const tx = await contract.submitEntry(title, descriptionHash, fileHash, tags, categories);
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  // 评分作品
  const scoreEntry = useCallback(async (entryId: number) => {
    setIsLoading(true);
    try {
      const { contract } = await getContract();
      const tx = await contract.scoreEntry(entryId);
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  // 投票作品
  const voteEntry = useCallback(async (entryId: number, category: string) => {
    setIsLoading(true);
    try {
      const { contract } = await getContract();
      const tx = await contract.voteEntry(entryId, category);
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  // 获取所有参赛作品
  const getAllEntries = useCallback(async (): Promise<ContractEntry[]> => {
    const { contract } = await getContract();
    const entryIds = await contract.getAllEntries();
    
    const entries: ContractEntry[] = [];
    for (const id of entryIds) {
      const entry = await contract.getEntry(id);
      entries.push({
        id: entry[0],
        contestant: entry[1],
        title: entry[2],
        descriptionHash: entry[3],
        fileHash: entry[4],
        tags: entry[5],
        categories: entry[6],
        timestamp: entry[7],
        scoresHandle: entry[8],
      });
    }
    
    return entries;
  }, [getContract]);

  // 解密评分
  const decryptScores = useCallback(async (entries: ContractEntry[]): Promise<DecryptedEntry[]> => {
    if (!fhevm) throw new Error('FHEVM 未初始化');
    
    const { contractAddress } = await getContract();
    const handles = entries.map(entry => entry.scoresHandle);
    const decryptedScores = await batchDecrypt(contractAddress, handles);
    
    return entries.map((entry, index) => ({
      ...entry,
      scores: decryptedScores[index],
    }));
  }, [fhevm, getContract]);

  // 获取类别投票
  const getCategoryVotes = useCallback(async (entryId: number, categories: string[]): Promise<CategoryVotes> => {
    const { contract, contractAddress } = await getContract();
    const votes: CategoryVotes = {};
    
    for (const category of categories) {
      const handle = await contract.getCategoryVotes(entryId, category);
      let voteCount = 0;
      
      if (handle !== 0n) {
        voteCount = await decryptValue(contractAddress, handle);
      }
      
      votes[category] = {
        handle,
        votes: voteCount,
      };
    }
    
    return votes;
  }, [getContract]);

  // 批量解密类别投票
  const batchDecryptCategoryVotes = useCallback(async (
    entries: ContractEntry[],
    targetCategory: string
  ): Promise<{ entryId: bigint; votes: number }[]> => {
    if (!fhevm) throw new Error('FHEVM 未初始化');
    
    const { contract, contractAddress } = await getContract();
    const results: { entryId: bigint; votes: number }[] = [];
    
    for (const entry of entries) {
      if (entry.categories.includes(targetCategory)) {
        const handle = await contract.getCategoryVotes(entry.id, targetCategory);
        let votes = 0;
        
        if (handle !== 0n) {
          votes = await decryptValue(contractAddress, handle);
        }
        
        results.push({
          entryId: entry.id,
          votes,
        });
      }
    }
    
    return results.sort((a, b) => b.votes - a.votes);
  }, [fhevm, getContract]);

  return {
    isLoading,
    submitEntry,
    scoreEntry,
    voteEntry,
    getAllEntries,
    decryptScores,
    getCategoryVotes,
    batchDecryptCategoryVotes,
  };
}
