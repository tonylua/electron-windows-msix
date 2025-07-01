1. Powershell 管理员权限

```
Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin\" | Select-Object Name
```

```
Name
----
10.0.14393.0
10.0.15063.0
10.0.16299.0
10.0.17134.0
10.0.22000.0
10.0.22621.0
arm
arm64
x64
x86
```

修改 test\fixtures\AppxManifest_x64.xml

2. 生成测试用自签名证书

```
Export-PfxCertificate -Cert $cert -FilePath "C:\temp\ElectronTestCert.pfx" -Password (ConvertTo-SecureString -String "YourPassword" -Force -AsPlainText)
```
