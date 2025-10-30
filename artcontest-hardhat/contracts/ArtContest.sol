// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, euint64, euint256, externalEuint32, externalEuint64, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ArtContest – 链上艺术评选竞赛平台（FHE 版）
/// @notice 参赛作品的评分、投票计数等以 FHE 加密存储，参赛者与评委通过 ACL 进行解密授权；
///         作品文件与描述等明文内容仅保存哈希（例如 IPFS/Arweave 哈希）。
contract ArtContest is SepoliaConfig {
    struct ContestEntry {
        uint256 id;                    // 参赛作品ID
        address contestant;            // 参赛者地址
        string title;                  // 作品标题（明文）
        string descriptionHash;        // 作品描述哈希（加密文本外链，如 IPFS/Arweave）
        string fileHash;               // 作品文件哈希（图片/视频/音频）
        string[] tags;                 // 创作标签（明文用于筛选）
        string[] categories;           // 参赛类别（可多选，用于排行榜）
        euint32 scoresEnc;             // 加密的评分计数
        uint64 timestamp;              // 提交时间
    }

    struct JudgeVote {
        uint256 entryId;               // 参赛作品ID
        address judge;                 // 评委地址
        string category;               // 类别（明文，用于排行榜与筛选）
        uint64 timestamp;              // 投票时间
    }

    // 下一个ID计数器
    uint256 public nextEntryId = 1;

    // 存储
    mapping(uint256 => ContestEntry) private _entries;
    uint256[] private _entryIds;

    // 投票计数：按 (entryId, category) 聚合，加密存储。
    mapping(uint256 => mapping(bytes32 => euint32)) private _votesByEntryAndCategory;
    mapping(uint256 => mapping(bytes32 => bool)) private _votesInitialized;

    // 事件
    event EntrySubmitted(uint256 indexed entryId, address indexed contestant, string title);
    event EntryScored(uint256 indexed entryId, address indexed judge);
    event EntryVoted(uint256 indexed entryId, address indexed judge, string category);

    /// @notice 提交参赛作品。评分计数器以 FHE 初始化为 0，并将解密权限授予合约与参赛者。
    function submitEntry(
        string calldata title,
        string calldata descriptionHash,
        string calldata fileHash,
        string[] calldata tags,
        string[] calldata categories
    ) external returns (uint256 entryId) {
        entryId = nextEntryId++;

        euint32 scores = FHE.asEuint32(0);

        ContestEntry storage entry = _entries[entryId];
        entry.id = entryId;
        entry.contestant = msg.sender;
        entry.title = title;
        entry.descriptionHash = descriptionHash;
        entry.fileHash = fileHash;
        entry.timestamp = uint64(block.timestamp);
        entry.scoresEnc = scores;

        for (uint256 i = 0; i < tags.length; i++) {
            entry.tags.push(tags[i]);
        }
        
        for (uint256 i = 0; i < categories.length; i++) {
            entry.categories.push(categories[i]);
        }

        // 授权：合约自身与参赛者可以访问/授权 scoresEnc
        FHE.allowThis(entry.scoresEnc);
        FHE.allow(entry.scoresEnc, msg.sender);

        _entryIds.push(entryId);

        emit EntrySubmitted(entryId, msg.sender, title);
    }

    /// @notice 评分（加密计数 +1）。
    /// @dev 使用明文 1 做标量加法，省 gas；同时将最新值授权给合约、参赛者与评委（临时授权可选）。
    function scoreEntry(uint256 entryId) external {
        ContestEntry storage entry = _entries[entryId];
        require(entry.contestant != address(0), "Entry not found");

        // FHE add scalar 1
        entry.scoresEnc = FHE.add(entry.scoresEnc, 1);

        // 刷新授权：保持合约与参赛者可解密，临时授权本次发送者（仅当前 tx）
        FHE.allowThis(entry.scoresEnc);
        FHE.allow(entry.scoresEnc, entry.contestant);
        FHE.allowTransient(entry.scoresEnc, msg.sender);

        emit EntryScored(entryId, msg.sender);
    }

    /// @notice 按类别投票（加密计数 +1）。只能对作品所属的类别投票。
    function voteEntry(uint256 entryId, string calldata category) external {
        ContestEntry storage entry = _entries[entryId];
        require(entry.contestant != address(0), "Entry not found");
        
        // 检查作品是否属于该类别
        bool belongsToCategory = false;
        for (uint256 i = 0; i < entry.categories.length; i++) {
            if (keccak256(bytes(entry.categories[i])) == keccak256(bytes(category))) {
                belongsToCategory = true;
                break;
            }
        }
        require(belongsToCategory, "Entry does not belong to this category");

        bytes32 catKey = keccak256(bytes(category));
        euint32 current = _votesByEntryAndCategory[entryId][catKey];
        if (!_votesInitialized[entryId][catKey]) {
            current = FHE.asEuint32(0);
            _votesInitialized[entryId][catKey] = true;
        }
        current = FHE.add(current, 1);
        _votesByEntryAndCategory[entryId][catKey] = current;

        // 授权：合约与参赛者可解密，临时授权投票者（当前 tx）
        FHE.allowThis(current);
        FHE.allow(current, entry.contestant);
        FHE.allowTransient(current, msg.sender);

        emit EntryVoted(entryId, msg.sender, category);
    }

    /// @notice 获取参赛作品元数据（不含明文评分）。
    function getEntry(uint256 entryId)
        external
        view
        returns (
            uint256 id,
            address contestant,
            string memory title,
            string memory descriptionHash,
            string memory fileHash,
            string[] memory tags,
            string[] memory categories,
            uint64 timestamp,
            euint32 scoresHandle
        )
    {
        ContestEntry storage entry = _entries[entryId];
        require(entry.contestant != address(0), "Entry not found");
        return (
            entry.id,
            entry.contestant,
            entry.title,
            entry.descriptionHash,
            entry.fileHash,
            entry.tags,
            entry.categories,
            entry.timestamp,
            entry.scoresEnc
        );
    }

    /// @notice 获取全部参赛作品的 ID 列表（用于前端批量查询）。
    function getAllEntries() external view returns (uint256[] memory ids) {
        return _entryIds;
    }

    /// @notice 获取某参赛作品在某类别下的投票计数（加密句柄）。
    function getCategoryVotes(uint256 entryId, string calldata category) external view returns (euint32 votesHandle) {
        bytes32 catKey = keccak256(bytes(category));
        return _votesByEntryAndCategory[entryId][catKey];
    }
}
