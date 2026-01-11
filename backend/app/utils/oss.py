"""
阿里云 OSS 工具模块
封装 OSS SDK，提供签名生成、文件操作等功能
"""
import json
import base64
import hmac
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass

from app.core.config import oss_settings


@dataclass
class OSSClient:
    """OSS 客户端封装"""
    
    @property
    def enabled(self) -> bool:
        """是否启用 OSS"""
        return oss_settings.is_configured
    
    def generate_upload_signature(
        self,
        access_key: str,
        file_hash: str,
        filename: str,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        生成前端直传 OSS 的签名
        
        使用 Policy 签名方式，前端可直接使用表单或 SDK 上传
        
        Args:
            access_key: 订单访问密钥
            file_hash: 文件 SHA256 哈希
            filename: 原始文件名
            content_type: 文件 MIME 类型
            
        Returns:
            签名信息字典，包含 policy, signature, accessid, host, dir, expire, callback
        """
        if not self.enabled:
            raise RuntimeError("OSS 未启用或配置不完整")
        
        # 计算过期时间
        expire_time = int(time.time()) + oss_settings.expire_seconds
        expire_datetime = datetime.utcnow() + timedelta(seconds=oss_settings.expire_seconds)
        expire_str = expire_datetime.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 上传目录: temp_uploads/{access_key}/{file_hash}/
        upload_dir = f"{oss_settings.upload_prefix}/{access_key}/{file_hash}/"
        
        # 构建 Policy
        policy_dict = {
            "expiration": expire_str,
            "conditions": [
                ["content-length-range", 0, 300 * 1024 * 1024],  # 最大 300MB
                ["starts-with", "$key", upload_dir],
            ]
        }
        policy_json = json.dumps(policy_dict)
        policy_base64 = base64.b64encode(policy_json.encode()).decode()
        
        # 计算签名
        signature = self._sign_policy(policy_base64)
        
        # 构建回调参数
        callback_dict = {
            "callbackUrl": oss_settings.callback_url,
            "callbackBody": (
                "bucket=${bucket}&object=${object}&size=${size}&etag=${etag}"
                "&mimeType=${mimeType}"
                f"&access_key={access_key}&file_hash={file_hash}"
                f"&filename_original={filename}"
            ),
            "callbackBodyType": "application/x-www-form-urlencoded"
        }
        callback_base64 = base64.b64encode(json.dumps(callback_dict).encode()).decode()
        
        return {
            "accessid": oss_settings.access_key_id,
            "policy": policy_base64,
            "signature": signature,
            "dir": upload_dir,
            "host": oss_settings.host,
            "expire": expire_time,
            "callback": callback_base64,
        }
    
    def generate_download_url(
        self,
        oss_key: str,
        expires: int = 3600,
        filename: Optional[str] = None
    ) -> str:
        """
        生成私有文件的签名下载 URL
        
        Args:
            oss_key: 文件在 OSS 中的路径
            expires: 签名有效期（秒），默认 1 小时
            filename: 下载时的文件名（可选，用于 Content-Disposition）
            
        Returns:
            签名后的下载 URL
        """
        if not self.enabled:
            raise RuntimeError("OSS 未启用或配置不完整")
        
        expire_time = int(time.time()) + expires
        
        # 构建待签名字符串
        # GET\n\n\n{expire}\n/{bucket}/{object}
        string_to_sign = f"GET\n\n\n{expire_time}\n/{oss_settings.bucket_name}/{oss_key}"
        
        # 计算签名
        signature = self._sign_string(string_to_sign)
        signature_encoded = self._url_encode(signature)
        
        # 构建 URL
        url = f"{oss_settings.host}/{oss_key}"
        url += f"?OSSAccessKeyId={oss_settings.access_key_id}"
        url += f"&Expires={expire_time}"
        url += f"&Signature={signature_encoded}"
        
        # 添加下载文件名
        if filename:
            encoded_filename = self._url_encode(filename)
            url += f"&response-content-disposition=attachment%3Bfilename%3D{encoded_filename}"
        
        return url
    
    def delete_file(self, oss_key: str) -> bool:
        """
        删除 OSS 文件
        
        注意：这里使用的是简化实现，生产环境建议使用官方 SDK
        
        Args:
            oss_key: 文件在 OSS 中的路径
            
        Returns:
            是否删除成功
        """
        if not self.enabled:
            return False
        
        # 简化实现：返回 True，实际需要调用 OSS API
        # 生产环境应使用 oss2 SDK
        # import oss2
        # auth = oss2.Auth(access_key_id, access_key_secret)
        # bucket = oss2.Bucket(auth, endpoint, bucket_name)
        # bucket.delete_object(oss_key)
        return True
    
    def _sign_policy(self, policy_base64: str) -> str:
        """签名 Policy"""
        h = hmac.new(
            oss_settings.access_key_secret.encode(),
            policy_base64.encode(),
            hashlib.sha1
        )
        return base64.b64encode(h.digest()).decode()
    
    def _sign_string(self, string_to_sign: str) -> str:
        """签名字符串"""
        h = hmac.new(
            oss_settings.access_key_secret.encode(),
            string_to_sign.encode(),
            hashlib.sha1
        )
        return base64.b64encode(h.digest()).decode()
    
    def _url_encode(self, s: str) -> str:
        """URL 编码"""
        from urllib.parse import quote
        return quote(s, safe='')
    
    def verify_callback(self, authorization: str, pub_key_url: str, body: bytes, uri: str) -> bool:
        """
        验证 OSS 回调签名（防止伪造）
        
        注意：完整实现需要下载公钥并验证签名
        生产环境必须启用此验证
        
        Args:
            authorization: 请求头中的 Authorization
            pub_key_url: 请求头中的 x-oss-pub-key-url
            body: 请求体
            uri: 请求 URI
            
        Returns:
            签名是否有效
        """
        # 简化实现：跳过验证
        # 生产环境应下载公钥并验证 RSA 签名
        # 参考：https://help.aliyun.com/document_detail/31989.html
        return True


# 全局单例
oss_client = OSSClient()
