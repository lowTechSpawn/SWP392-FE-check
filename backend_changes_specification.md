# Backend & Storage Changes Specification

This document details the required backend and storage changes in the `MangaManagementSystem` solution to support the new features and security requirements for manga proposals and workspace files.

---

## 1. Storage & Security Architecture (Supabase Storage)

To protect creators' intellectual property (such as source PSD, CLIP, and high-res files), the system uses a dual-bucket model:

1. **Public Bucket (`proposal-files`)**: 
   - Used for **preview images** (`ProposalPages`) and cover art.
   - Access: Public read.
2. **Private Bucket (`proposal-source`)**:
   - Used for the **source ZIP manuscript packages**.
   - Access: Private (only authorized roles: Creator/Mangaka and the assigned Tantou Editor can access it).
   - Delivery: The backend generates a temporary **Signed URL** (valid for 5–15 minutes) when the editor requests the proposal details.

---

## 2. File Streaming Endpoint (Fallback for Local Storage)

### Target File
`MangaManagementSystem.WebApi/Controllers/FileController.cs`

### Purpose
Acts as a secure streaming endpoint when running on **local storage** instead of Supabase Storage. It streams raw ZIP packages and sample pages.

### Required Code Additions

#### A. Add the following namespaces:
```csharp
using MangaManagementSystem.DataAccess.Entities.Models;
using MangaManagementSystem.DataAccess.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.IO;
```

#### B. Inject `IRepository<FileAsset>` and `IConfiguration` into the constructor:
```csharp
private readonly IFileUploadService _fileUploadService;
private readonly IRepository<FileAsset> _fileAssetRepository;
private readonly string _rootPath;

public FileController(
    IFileUploadService fileUploadService,
    IRepository<FileAsset> fileAssetRepository,
    IConfiguration configuration)
{
    _fileUploadService = fileUploadService;
    _fileAssetRepository = fileAssetRepository;
    _rootPath = configuration["FileStorage:RootPath"]
        ?? Path.Combine(Path.GetTempPath(), "MangaManagementSystem", "uploads");
}
```

#### C. Add the `GET` endpoint to stream files:
```csharp
[HttpGet("{id:guid}")]
[AllowAnonymous]
[SwaggerOperation(Summary = "Retrieve/download a file asset by ID")]
public async Task<IActionResult> GetFile(Guid id)
{
    var asset = await _fileAssetRepository.GetAll()
        .FirstOrDefaultAsync(x => x.FileAssetId == id && x.DeletedAt == null);

    if (asset == null)
    {
        return NotFound(new BaseResponse { Message = "File not found." });
    }

    var fullPath = Path.Combine(_rootPath, asset.ObjectPath.Replace('/', Path.DirectorySeparatorChar));
    if (!System.IO.File.Exists(fullPath))
    {
        return NotFound(new BaseResponse { Message = "Physical file not found on storage." });
    }

    var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
    return File(stream, asset.MimeType, asset.OriginalFileName);
}
```

---

## 3. Include Email in User Assignment Responses

### Purpose
Expose the email of the assigned user in the mapping responses so the frontend can display it correctly.

### Changes:

### A. DTO Response
`MangaManagementSystem.Business/DTOs/Responses/Users/UserAssignmentResponse.cs`

Add the property:
```csharp
public string ToUserEmail { get; set; } = null!;
```

### B. Service Mapping
`MangaManagementSystem.Business/Services/Implements/Users/UserAssignmentService.cs`

Map `ToUserEmail` inside the conversion:
```csharp
private static UserAssignmentResponse Map(UserAssignment a) => new()
{
    AssignmentId = a.AssignmentId, 
    FromUserId = a.FromUserId, 
    FromUserName = a.FromUser?.DisplayName ?? "",
    ToUserId = a.ToUserId, 
    ToUserName = a.ToUser?.DisplayName ?? "",
    ToUserEmail = a.ToUser?.Email ?? "", // <-- Map this property
    AssignedAt = a.AssignedAt, 
    UnassignedAt = a.UnassignedAt
};
```

---

## 4. Proposal Details Payload Structure (ZIP & Preview Pages)

When the frontend calls `GET /api/series/{id}` (or proposal details), the backend should return the following structures:

### A. Proposal Page Schema (with `Url` property)
For preview pages, the backend should return the public URL directly:
```json
{
  "proposalPageId": "guid-here",
  "seriesId": "guid-here",
  "pageNo": 1,
  "previewFileAssetId": "guid-here",
  "url": "https://xxx.supabase.co/storage/v1/object/public/proposal-files/proposals/abc/page1.jpg"
}
```

### B. Source ZIP Package Schema (with temporary Signed URL)
For the ZIP package, the backend should return the `sourceZipFile` object containing a temporary signed URL:
```json
{
  "seriesId": "abc",
  "title": "My Manga",
  "sourceZipFile": {
    "fileAssetId": "xxx",
    "fileName": "source.zip",
    "url": "https://xxx.supabase.co/storage/v1/object/sign/proposal-source/proposals/abc/source.zip?token=expires-in-5-min"
  }
}
```
*(If Supabase storage is not configured, the `url` can fallback to `/api/files/{fileAssetId}` for local streaming).*
