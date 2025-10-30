'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initFhevm, resetFhevmInstance } from './internal/fhevm';
import { FhevmInstance } from './fhevmTypes';

interface FhevmContextType {
  fhevm: FhevmInstance | null;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
}

const FhevmContext = createContext<FhevmContextType>({
  fhevm: null,
  isLoading: true,
  error: null,
  chainId: null,
});

interface FhevmProviderProps {
  children: ReactNode;
}

export function FhevmProvider({ children }: FhevmProviderProps) {
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        setError(null);

        // 检查是否有 window.ethereum
        if (typeof window !== 'undefined' && window.ethereum) {
          // 获取链 ID
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const numericChainId = parseInt(String(currentChainId), 16);
          setChainId(numericChainId);

          // 初始化 FHEVM
          const instance = await initFhevm(numericChainId);
          setFhevm(instance);
        } else {
          throw new Error('请安装 MetaMask 钱包');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初始化失败';
        setError(errorMessage);
        console.error('FHEVM 初始化错误:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();

    // 监听链切换
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (newChainId: string) => {
        resetFhevmInstance();
        setFhevm(null);
        initialize();
      };

      window.ethereum?.on?.('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <FhevmContext.Provider value={{ fhevm, isLoading, error, chainId }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevm must be used within a FhevmProvider');
  }
  return context;
}
