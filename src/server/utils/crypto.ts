import crypto from 'crypto';

/**
 * 生成SHA256哈希
 */
export function sha256Hash(input: string): Promise<string> {
  return new Promise((resolve) => {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    resolve(hash.digest('hex'));
  });
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 验证密码哈希
 */
export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  const inputHash = await sha256Hash(password);
  return inputHash === hash;
}
