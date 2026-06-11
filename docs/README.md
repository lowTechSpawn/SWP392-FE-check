<p align="center">
  <img src="https://img.shields.io/badge/status-In%20Development-yellow?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/semester-Summer%202026-blue?style=for-the-badge" alt="Semester" />
  <img src="https://img.shields.io/badge/course-SWP391-red?style=for-the-badge" alt="Course" />
</p>

# 📚 MangaHub — Manga Creation & Publishing Management System

> **Hệ thống quản lý quy trình sáng tác và xuất bản Manga**

**Topic Code:** `SU26SWP04` &nbsp;|&nbsp; **Semester:** Summer 2026

---

## 📖 Giới thiệu dự án

**MangaHub** là hệ thống quản lý toàn diện cho quy trình sáng tác và xuất bản Manga — từ giai đoạn nộp bản thảo ban đầu cho đến quyết định xuất bản cuối cùng và xếp hạng từ độc giả.

### 🎯 Bối cảnh & Vấn đề

Ngành công nghiệp Manga đòi hỏi sự cộng tác chặt chẽ giữa **Mangaka** (tác giả), **Assistants** (trợ lý), **Tantou Editors** (biên tập viên phụ trách) và **Editorial Board** (ban biên tập). Hiện tại, quy trình làm việc bị phân mảnh trên nhiều công cụ khác nhau:

| Vấn đề hiện tại | Mô tả |
|---|---|
| 📁 Chia sẻ bản thảo | Google Drive, WeTransfer — không có quản lý phiên bản tập trung |
| 💬 Giao việc | Qua Zalo/Line — khó theo dõi tiến độ |
| ✉️ Phản hồi biên tập | Email — thiếu tính tương tác trực tiếp |
| 📊 Dữ liệu bình chọn | Nhập thủ công từ spreadsheet — dễ sai sót và chậm trễ |

### 🔑 Điểm đau chính

1. Tác giả và trợ lý phải sử dụng nhiều ứng dụng — khó theo dõi tiến độ từng trang.
2. Biên tập viên không có khả năng xem tiến độ hoàn thành của studio theo thời gian thực.
3. Ban biên tập thiếu hệ thống bỏ phiếu có cấu trúc cho các quyết định xuất bản.
4. Dữ liệu xếp hạng series được cập nhật thủ công — dễ xảy ra lỗi và chậm trễ.

---

## 🧩 Phạm vi dự án

### ✅ Trong phạm vi (In Scope)

- 📝 Nộp đề xuất series mới và bỏ phiếu của Ban biên tập
- 📄 Phân công task chương/trang từ Mangaka cho Assistants
- 📊 Theo dõi tiến độ cấp trang (**Pending → In-Progress → Review → Approved**)
- ✏️ Tantou Editor review bản thảo với chú thích trực tiếp (inline annotation)
- 🗳️ Nhập dữ liệu bình chọn từ độc giả và xếp hạng series tự động
- ⚖️ Quy trình quyết định hủy/thay đổi loại xuất bản của Ban biên tập

### ❌ Ngoài phạm vi (Out of Scope)

- AI auto-coloring hoặc phân đoạn trang
- Nền tảng đọc manga công khai cho độc giả
- Thanh toán thực tế cho trợ lý (chỉ hiển thị thu nhập)
- Tích hợp với nền tảng xuất bản bên ngoài (Shonen Jump, Webtoon, v.v.)

---

## 👥 Vai trò người dùng (Actors)

| Actor | Tần suất | Mô tả vai trò |
|---|---|---|
| 🎨 **Mangaka** | Hàng ngày | Tạo series, assign tasks cho assistant, approve/reject từng trang |
| ✍️ **Assistant** | Hàng ngày | Nhận task, hoàn thiện phần việc, submit lại cho Mangaka review |
| 📋 **Tantou Editor** | Hàng tuần | Review bản thảo, annotate trực tiếp, bảo vệ series trước board |
| 🏛️ **Editorial Board** | Hàng tháng | Bỏ phiếu series mới, nhập vote độc giả, quyết định hủy/thay đổi |

---

## 🗂️ Thực thể chính (Key Entities)

```
Series          ─── seriesID, title, genre, mangakaID, editorID, publicationType, status, rankingScore
Chapter         ─── chapterID, seriesID, chapterNo, deadline, submittedAt, approvedAt, status
PageTask        ─── taskID, chapterID, assistantID, pageRange, taskType, dueDate, status
Manuscript      ─── msID, chapterID, fileURL, version, submittedAt, editorFeedback, status
VoteRecord      ─── voteID, seriesID, period, readerCount, voteCount, rankPosition, enteredAt
BoardDecision   ─── decisionID, seriesID, decisionType, votes[], reason, decisionDate
```

---

## 📏 Quy tắc nghiệp vụ (Business Rules)

| Mã | Loại | Mô tả |
|---|---|---|
| **BR-01** | Behavioral | Tantou Editor **KHÔNG ĐƯỢC** bỏ phiếu cho quyết định xuất bản của series mà họ trực tiếp quản lý (xung đột lợi ích). |
| **BR-02** | Calculational | Xếp hạng series = `(voteCount / readerCount) × 100%`; nếu bằng điểm thì so sánh theo tổng vote. Bottom 20% bị đánh dấu để xem xét hủy. |
| **BR-03** | Temporal | Deadline nộp chương là **14 ngày** trước ngày xuất bản; trễ deadline sẽ tự động gửi cảnh báo cho editor. |
| **BR-04** | Definitional | Page task chỉ hoàn thành khi Mangaka đánh dấu **"Approved"**; trạng thái "Submitted" không được tính vào % hoàn thành chương. |
| **BR-05** | Behavioral | Ban biên tập cần tối thiểu **3 phiếu** (quorum) để thông qua quyết định hủy series; dưới 3 phiếu → quyết định bị hoãn. |

---

## 👨‍💻 Thành viên nhóm & Vai trò

| # | Họ và Tên | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| 1 | **Đỗ Quốc Bảo** | 🔧 Backend Developer | Thiết kế & phát triển API, xử lý logic nghiệp vụ, quản lý database |
| 2 | **Lý Gia Khiêm** | 🔧 Backend Developer | Xây dựng RESTful API, authentication/authorization, business rules |
| 3 | **Trần Đăng Hải** | 🔧 Backend Developer | Phát triển API endpoints, data validation, integration testing |
| 4 | **Nguyễn Trần Thịnh** | 🎨 Frontend Developer | Thiết kế giao diện người dùng, phát triển UI components, responsive design |
| 5 | **Nguyễn Hoàng Thưởng** | 🎨 Frontend Developer | Xây dựng các trang chức năng, state management, API integration |

---

## 🛠️ Công nghệ sử dụng

### Backend

| Công nghệ | Mô tả |
|---|---|
| ![C#](https://img.shields.io/badge/C%23-239120?style=flat-square&logo=csharp&logoColor=white) **C#** | Ngôn ngữ lập trình chính cho backend |
| ![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat-square&logo=dotnet&logoColor=white) **ASP.NET Core** | Framework xây dựng RESTful Web API |
| ![EF Core](https://img.shields.io/badge/Entity%20Framework-512BD4?style=flat-square&logo=dotnet&logoColor=white) **Entity Framework Core** | ORM cho thao tác database |
| ![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white) **SQL Server** | Hệ quản trị cơ sở dữ liệu |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) **Swagger / OpenAPI** | Tài liệu hóa và test API |

### Frontend

| Công nghệ | Mô tả |
|---|---|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) **React** | Thư viện xây dựng giao diện người dùng (SPA) |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) **Tailwind CSS** | Framework CSS utility-first cho styling nhanh và nhất quán |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) **Vite** | Build tool & dev server siêu nhanh |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) **Axios** | HTTP client cho gọi API |

### DevOps & Tools

| Công nghệ | Mô tả |
|---|---|
| ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) **Git** | Quản lý phiên bản source code |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) **GitHub** | Lưu trữ repository và quản lý dự án |
| ![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white) **VS Code** | IDE cho Frontend development |
| ![Visual Studio](https://img.shields.io/badge/Visual%20Studio-5C2D91?style=flat-square&logo=visualstudio&logoColor=white) **Visual Studio** | IDE cho Backend development |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │          React + Tailwind CSS + Vite              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │  Pages   │  │Components│  │    Hooks      │    │  │
│  │  └──────────┘  └──────────┘  └──────────────┘    │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ HTTP / REST API (Axios)       │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                   SERVER SIDE                           │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │            ASP.NET Core Web API                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │Controllers│ │ Services │  │ Repositories │    │  │
│  │  └──────────┘  └──────────┘  └──────┬───────┘    │  │
│  └─────────────────────────────────────┼─────────────┘  │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │          Entity Framework Core (ORM)              │  │
│  └─────────────────────────────────────┬─────────────┘  │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │              SQL Server Database                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống

- [.NET 8 SDK](https://dotnet.microsoft.com/download) trở lên
- [Node.js](https://nodejs.org/) v18+ & npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (hoặc SQL Server Express)
- [Git](https://git-scm.com/)

### Backend

```bash
# Clone repository
git clone <repository-url>
cd <project-folder>/backend

# Restore dependencies
dotnet restore

# Cập nhật connection string trong appsettings.json

# Chạy migration
dotnet ef database update

# Khởi chạy server
dotnet run
```

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd <project-folder>/frontend

# Cài đặt dependencies
npm install

# Khởi chạy dev server
npm run dev
```

---

## 📂 Cấu trúc thư mục dự kiến

```
MangaHub/
├── backend/                    # ASP.NET Core Web API
│   ├── Controllers/            # API Controllers
│   ├── Models/                 # Entity models
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Services/               # Business logic layer
│   ├── Repositories/           # Data access layer
│   ├── Migrations/             # EF Core migrations
│   └── appsettings.json        # Configuration
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API call services
│   │   ├── utils/              # Utility functions
│   │   └── App.jsx             # Root component
│   ├── tailwind.config.js      # Tailwind configuration
│   └── package.json
│
└── README.md
```

---

## 📝 Module trọng tâm

> **Manuscript Submission & Editorial Review Module**
>
> Module chính của dự án trong kỳ SU26, tập trung vào quy trình nộp bản thảo và review biên tập.

---

## 📄 Giấy phép

Dự án này được phát triển phục vụ mục đích học tập trong khuôn khổ môn **SWP391** — **FPT University**, Semester **Summer 2026**.

---

<p align="center">
  Made with ❤️ by <strong>Team SU26SWP04</strong> — FPT University
</p>

## Database

Table "Roles" {
  "RoleId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "RoleName" NVARCHAR(50) [not null]

  Indexes {
    RoleId [pk, name: "PK_Roles"]
    RoleName [unique, name: "UQ_Roles_RoleName"]
  }
}

Table "Users" {
  "UserId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "RoleId" UNIQUEIDENTIFIER [not null]
  "UserName" NVARCHAR(100) [not null]
  "Email" NVARCHAR(255) [not null]
  "PasswordHash" NVARCHAR(MAX) [not null]
  "DisplayName" NVARCHAR(150) [not null]
  "IsActive" BIT [not null, default: 1]
  "DeletedAt" DATETIME2

  Indexes {
    UserId [pk, name: "PK_Users"]
    Email [unique, name: "UQ_Users_Email"]
  }
}

Table "Genre" {
  "GenreId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "GenreName" NVARCHAR(100) [not null]

  Indexes {
    GenreId [pk, name: "PK_Genre"]
    GenreName [unique, name: "UQ_Genre_GenreName"]
  }
}

Table "FileAsset" {
  "FileAssetId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "FileName" NVARCHAR(255) [not null]
  "FileUrl" NVARCHAR(1000) [not null]
  "FileType" NVARCHAR(50) [not null]
  "UploadedByUserId" UNIQUEIDENTIFIER [not null]
  "DeletedAt" DATETIME2

  Indexes {
    FileAssetId [pk, name: "PK_FileAsset"]
  }
}

Table "Series" {
  "SeriesId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "MangakaId" UNIQUEIDENTIFIER [not null]
  "GenreId" UNIQUEIDENTIFIER [not null]
  "Title" NVARCHAR(100) [not null]
  "Synopsis" NVARCHAR(2000) [not null]
  "PublicationType" NVARCHAR(50) [not null]
  "Status" NVARCHAR(50) [not null]
  "CoverFileAssetId" UNIQUEIDENTIFIER
  "DeletedAt" DATETIME2

  Indexes {
    SeriesId [pk, name: "PK_Series"]
  }
}

Table "ProposalPage" {
  "ProposalPageId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "FileAssetId" UNIQUEIDENTIFIER [not null]
  "PageNumber" INT [not null]

  Indexes {
    ProposalPageId [pk, name: "PK_ProposalPage"]
  }
}

Table "UserAssignments" {
  "UserAssignmentId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "UserId" UNIQUEIDENTIFIER [not null]
  "RoleId" UNIQUEIDENTIFIER [not null]
  "AssignedByUserId" UNIQUEIDENTIFIER [not null]
  "DeletedAt" DATETIME2

  Indexes {
    UserAssignmentId [pk, name: "PK_UserAssignments"]
  }
}

Table "BoardVotes" {
  "BoardVoteId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "BoardMemberId" UNIQUEIDENTIFIER [not null]
  "VoteValue" NVARCHAR(50) [not null]
  "Comment" NVARCHAR(1000)

  Indexes {
    BoardVoteId [pk, name: "PK_BoardVotes"]
    (SeriesId, BoardMemberId) [unique, name: "UQ_BoardVotes_Series_BoardMember"]
  }
}

Table "BoardDecisions" {
  "BoardDecisionId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "FinalDecision" NVARCHAR(50) [not null]
  "Reason" NVARCHAR(1000)
  "DecidedByUserId" UNIQUEIDENTIFIER [not null]

  Indexes {
    BoardDecisionId [pk, name: "PK_BoardDecisions"]
  }
}

Table "Chapters" {
  "ChapterId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "ChapterNumber" INT [not null]
  "Title" NVARCHAR(150) [not null]
  "Status" NVARCHAR(50) [not null]
  "DeletedAt" DATETIME2

  Indexes {
    ChapterId [pk, name: "PK_Chapters"]
    (SeriesId, ChapterNumber) [unique, name: "UQ_Chapters_Series_ChapterNumber"]
  }
}

Table "Manuscripts" {
  "ManuscriptId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "ChapterId" UNIQUEIDENTIFIER [not null]
  "SubmittedByUserId" UNIQUEIDENTIFIER [not null]
  "SourceFileAssetId" UNIQUEIDENTIFIER [not null]
  "VersionNumber" INT [not null]
  "Status" NVARCHAR(50) [not null]

  Indexes {
    ManuscriptId [pk, name: "PK_Manuscripts"]
  }
}

Table "PageTasks" {
  "PageTaskId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "ChapterId" UNIQUEIDENTIFIER [not null]
  "AssignedToUserId" UNIQUEIDENTIFIER [not null]
  "AssignedByUserId" UNIQUEIDENTIFIER [not null]
  "PageNumber" INT [not null]
  "Description" NVARCHAR(1000)
  "Status" NVARCHAR(50) [not null]

  Indexes {
    PageTaskId [pk, name: "PK_PageTasks"]
  }
}

Table "PageTaskSubmissions" {
  "PageTaskSubmissionId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "PageTaskId" UNIQUEIDENTIFIER [not null]
  "SubmittedByUserId" UNIQUEIDENTIFIER [not null]
  "FileAssetId" UNIQUEIDENTIFIER [not null]
  "Note" NVARCHAR(1000)
  "Status" NVARCHAR(50) [not null]

  Indexes {
    PageTaskSubmissionId [pk, name: "PK_PageTaskSubmissions"]
  }
}

Table "Annotations" {
  "AnnotationId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "ManuscriptId" UNIQUEIDENTIFIER [not null]
  "CreatedByUserId" UNIQUEIDENTIFIER [not null]
  "PageNumber" INT [not null]
  "PositionX" DECIMAL(18,4) [not null]
  "PositionY" DECIMAL(18,4) [not null]
  "Content" NVARCHAR(MAX) [not null]

  Indexes {
    AnnotationId [pk, name: "PK_Annotations"]
  }
}

Table "VoteRecords" {
  "VoteRecordId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "VoteCount" INT [not null]
  "ReaderCount" INT [not null]

  Indexes {
    VoteRecordId [pk, name: "PK_VoteRecords"]
  }
}

Table "RankingSnapshots" {
  "RankingSnapshotId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "RankNumber" INT [not null]
  "Score" DECIMAL(18,2) [not null]

  Indexes {
    RankingSnapshotId [pk, name: "PK_RankingSnapshots"]
  }
}

Table "Escalations" {
  "EscalationId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "SeriesId" UNIQUEIDENTIFIER [not null]
  "PageTaskId" UNIQUEIDENTIFIER
  "RaisedByUserId" UNIQUEIDENTIFIER [not null]
  "AssignedToUserId" UNIQUEIDENTIFIER
  "Reason" NVARCHAR(1000) [not null]
  "Status" NVARCHAR(50) [not null]

  Indexes {
    EscalationId [pk, name: "PK_Escalations"]
  }
}

Table "Notifications" {
  "NotificationId" UNIQUEIDENTIFIER [not null, default: `NEWSEQUENTIALID()`]
  "UserId" UNIQUEIDENTIFIER [not null]
  "Title" NVARCHAR(150) [not null]
  "Message" NVARCHAR(1000) [not null]
  "IsRead" BIT [not null, default: 0]

  Indexes {
    NotificationId [pk, name: "PK_Notifications"]
  }
}

Ref "FK_Users_Roles":"Roles"."RoleId" < "Users"."RoleId"

Ref "FK_FileAsset_Users":"Users"."UserId" < "FileAsset"."UploadedByUserId"

Ref "FK_Series_Mangaka":"Users"."UserId" < "Series"."MangakaId"

Ref "FK_Series_Genre":"Genre"."GenreId" < "Series"."GenreId"

Ref "FK_Series_CoverFileAsset":"FileAsset"."FileAssetId" < "Series"."CoverFileAssetId"

Ref "FK_ProposalPage_Series":"Series"."SeriesId" < "ProposalPage"."SeriesId"

Ref "FK_ProposalPage_FileAsset":"FileAsset"."FileAssetId" < "ProposalPage"."FileAssetId"

Ref "FK_UserAssignments_Series":"Series"."SeriesId" < "UserAssignments"."SeriesId"

Ref "FK_UserAssignments_User":"Users"."UserId" < "UserAssignments"."UserId"

Ref "FK_UserAssignments_Role":"Roles"."RoleId" < "UserAssignments"."RoleId"

Ref "FK_UserAssignments_AssignedBy":"Users"."UserId" < "UserAssignments"."AssignedByUserId"

Ref "FK_BoardVotes_Series":"Series"."SeriesId" < "BoardVotes"."SeriesId"

Ref "FK_BoardVotes_BoardMember":"Users"."UserId" < "BoardVotes"."BoardMemberId"

Ref "FK_BoardDecisions_Series":"Series"."SeriesId" < "BoardDecisions"."SeriesId"

Ref "FK_BoardDecisions_DecidedBy":"Users"."UserId" < "BoardDecisions"."DecidedByUserId"

Ref "FK_Chapters_Series":"Series"."SeriesId" < "Chapters"."SeriesId"

Ref "FK_Manuscripts_Chapters":"Chapters"."ChapterId" < "Manuscripts"."ChapterId"

Ref "FK_Manuscripts_SubmittedBy":"Users"."UserId" < "Manuscripts"."SubmittedByUserId"

Ref "FK_Manuscripts_SourceFile":"FileAsset"."FileAssetId" < "Manuscripts"."SourceFileAssetId"

Ref "FK_PageTasks_Chapters":"Chapters"."ChapterId" < "PageTasks"."ChapterId"

Ref "FK_PageTasks_AssignedTo":"Users"."UserId" < "PageTasks"."AssignedToUserId"

Ref "FK_PageTasks_AssignedBy":"Users"."UserId" < "PageTasks"."AssignedByUserId"

Ref "FK_PageTaskSubmissions_PageTasks":"PageTasks"."PageTaskId" < "PageTaskSubmissions"."PageTaskId"

Ref "FK_PageTaskSubmissions_SubmittedBy":"Users"."UserId" < "PageTaskSubmissions"."SubmittedByUserId"

Ref "FK_PageTaskSubmissions_FileAsset":"FileAsset"."FileAssetId" < "PageTaskSubmissions"."FileAssetId"

Ref "FK_Annotations_Manuscripts":"Manuscripts"."ManuscriptId" < "Annotations"."ManuscriptId"

Ref "FK_Annotations_CreatedBy":"Users"."UserId" < "Annotations"."CreatedByUserId"

Ref "FK_VoteRecords_Series":"Series"."SeriesId" < "VoteRecords"."SeriesId"

Ref "FK_RankingSnapshots_Series":"Series"."SeriesId" < "RankingSnapshots"."SeriesId"

Ref "FK_Escalations_Series":"Series"."SeriesId" < "Escalations"."SeriesId"

Ref "FK_Escalations_PageTasks":"PageTasks"."PageTaskId" < "Escalations"."PageTaskId"

Ref "FK_Escalations_RaisedBy":"Users"."UserId" < "Escalations"."RaisedByUserId"

Ref "FK_Escalations_AssignedTo":"Users"."UserId" < "Escalations"."AssignedToUserId"

Ref "FK_Notifications_Users":"Users"."UserId" < "Notifications"."UserId"

