import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARDHAT_DIR = path.resolve(__dirname, '../../artcontest-hardhat');
const ABI_DIR = path.resolve(__dirname, '../abi');

// 确保 abi 目录存在
if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR, { recursive: true });
}

function generateABI() {
  console.log('🔄 正在生成 ABI 文件...');

  // 读取合约部署信息
  const deploymentPaths = {
    localhost: path.join(HARDHAT_DIR, 'deployments/localhost/ArtContest.json'),
    sepolia: path.join(HARDHAT_DIR, 'deployments/sepolia/ArtContest.json'),
  };

  let abi = null;
  const addresses = {};

  // 尝试从不同网络读取部署信息
  for (const [network, deploymentPath] of Object.entries(deploymentPaths)) {
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      if (!abi) {
        abi = deployment.abi;
      }
      addresses[network] = deployment.address;
      console.log(`✅ 从 ${network} 读取到合约地址: ${deployment.address}`);
    } else {
      console.log(`⚠️  ${network} 部署文件不存在: ${deploymentPath}`);
    }
  }

  if (!abi) {
    console.error('❌ 未找到任何部署文件，请先部署合约');
    process.exit(1);
  }

  // 生成 ABI 文件
  const abiContent = `export const ArtContestABI = ${JSON.stringify(abi, null, 2)} as const;`;
  fs.writeFileSync(path.join(ABI_DIR, 'ArtContestABI.ts'), abiContent);

  // 生成地址文件
  // 确保始终包含 localhost 与 sepolia 字段，避免类型缩小导致的编译错误
  const completeAddresses = {
    localhost: addresses.localhost || '',
    sepolia: addresses.sepolia || '',
  };

  const addressContent = `export const ArtContestAddresses = ${JSON.stringify(completeAddresses, null, 2)} as const;

export function getArtContestAddress(chainId: number): string {
  switch (chainId) {
    case 31337:
      return ArtContestAddresses.localhost || '';
    case 11155111:
      return ArtContestAddresses.sepolia || '';
    default:
      throw new Error(\`Unsupported chain ID: \${chainId}\`);
  }
}`;

  fs.writeFileSync(path.join(ABI_DIR, 'ArtContestAddresses.ts'), addressContent);

  console.log('✅ ABI 文件生成完成');
  console.log(`📁 ABI 目录: ${ABI_DIR}`);
  console.log(`🔗 支持的网络: ${Object.keys(addresses).join(', ')}`);
}

generateABI();
