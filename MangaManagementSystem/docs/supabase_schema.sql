-- Kích hoạt extension sinh UUID (nếu chưa kích hoạt)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Roles
CREATE TABLE IF NOT EXISTS "Roles" (
    "RoleId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "RoleName" character varying(50) NOT NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("RoleId")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Roles_RoleName" ON "Roles" ("RoleName");

-- 2. Bảng Users
CREATE TABLE IF NOT EXISTS "Users" (
    "UserId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "RoleId" UUID NOT NULL,
    "UserName" character varying(100) NOT NULL,
    "Email" character varying(255) NOT NULL,
    "DisplayName" character varying(150) NOT NULL,
    "PasswordHash" text NOT NULL,
    "RefreshTokenHash" character varying(512) NULL,
    "RefreshTokenExpiresAt" timestamptz NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "LastLoginAt" timestamptz NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("UserId"),
    CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("RoleId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Users_RoleId" ON "Users" ("RoleId");

-- 3. Bảng FileAssets
CREATE TABLE IF NOT EXISTS "FileAssets" (
    "FileAssetId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "BucketName" character varying(100) NOT NULL,
    "ObjectPath" character varying(1000) NOT NULL,
    "OriginalFileName" character varying(255) NOT NULL,
    "StoredFileName" character varying(255) NOT NULL,
    "Extension" character varying(20) NOT NULL,
    "FileSizeBytes" bigint NOT NULL,
    "MimeType" character varying(100) NOT NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_FileAssets" PRIMARY KEY ("FileAssetId")
);

-- 4. Bảng Genres
CREATE TABLE IF NOT EXISTS "Genres" (
    "GenreId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Title" character varying(100) NOT NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Genres" PRIMARY KEY ("GenreId")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Genres_Title" ON "Genres" ("Title");

-- 5. Bảng Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "NotificationId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Title" character varying(150) NOT NULL,
    "Message" character varying(1000) NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Link" character varying(500) NULL,
    "Priority" character varying(50) NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("NotificationId")
);

-- 6. Bảng UserNotifications
CREATE TABLE IF NOT EXISTS "UserNotifications" (
    "UserNotificationId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL,
    "NotificationId" UUID NOT NULL,
    "IsRead" boolean NOT NULL DEFAULT FALSE,
    "ReadAt" timestamptz NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_UserNotifications" PRIMARY KEY ("UserNotificationId"),
    CONSTRAINT "FK_UserNotifications_Notifications_NotificationId" FOREIGN KEY ("NotificationId") REFERENCES "Notifications" ("NotificationId") ON DELETE RESTRICT,
    CONSTRAINT "FK_UserNotifications_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserNotifications_UserId_NotificationId" ON "UserNotifications" ("UserId", "NotificationId");
CREATE INDEX IF NOT EXISTS "IX_UserNotifications_NotificationId" ON "UserNotifications" ("NotificationId");

-- 7. Bảng UserAssignments
CREATE TABLE IF NOT EXISTS "UserAssignments" (
    "AssignmentId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "FromUserId" UUID NOT NULL,
    "ToUserId" UUID NOT NULL,
    "AssignedAt" timestamptz NOT NULL DEFAULT now(),
    "UnassignedAt" timestamptz NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_UserAssignments" PRIMARY KEY ("AssignmentId"),
    CONSTRAINT "FK_UserAssignments_Users_FromUserId" FOREIGN KEY ("FromUserId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "FK_UserAssignments_Users_ToUserId" FOREIGN KEY ("ToUserId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "CK_UserAssignments_NotSelf" CHECK ("FromUserId" <> "ToUserId")
);
CREATE INDEX IF NOT EXISTS "IX_UserAssignments_ToUserId" ON "UserAssignments" ("ToUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserAssignments_FromUserId_ToUserId" ON "UserAssignments" ("FromUserId", "ToUserId") 
WHERE "UnassignedAt" IS NULL AND "DeletedAt" IS NULL;

-- 8. Bảng Series
CREATE TABLE IF NOT EXISTS "Series" (
    "SeriesId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "MangakaId" UUID NOT NULL,
    "Title" character varying(150) NOT NULL,
    "PublicationType" character varying(50) NOT NULL,
    "RankingScore" numeric(18,2) NOT NULL DEFAULT 0.00,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "Status" character varying(50) NOT NULL,
    "SourceZipFileAssetId" UUID NULL,
    "Synopsis" character varying(2000) NOT NULL,
    "RejectReason" character varying(1000) NULL,
    "SubmittedAt" timestamptz NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Series" PRIMARY KEY ("SeriesId"),
    CONSTRAINT "FK_Series_FileAssets_SourceZipFileAssetId" FOREIGN KEY ("SourceZipFileAssetId") REFERENCES "FileAssets" ("FileAssetId") ON DELETE RESTRICT,
    CONSTRAINT "FK_Series_Users_MangakaId" FOREIGN KEY ("MangakaId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Series_SourceZipFileAssetId" ON "Series" ("SourceZipFileAssetId") WHERE ("SourceZipFileAssetId" IS NOT NULL);
CREATE INDEX IF NOT EXISTS "IX_Series_MangakaId" ON "Series" ("MangakaId");

-- 9. Bảng SeriesGenres
CREATE TABLE IF NOT EXISTS "SeriesGenres" (
    "SeriesGenreId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "GenreId" UUID NOT NULL,
    CONSTRAINT "PK_SeriesGenres" PRIMARY KEY ("SeriesGenreId"),
    CONSTRAINT "FK_SeriesGenres_Genres_GenreId" FOREIGN KEY ("GenreId") REFERENCES "Genres" ("GenreId") ON DELETE RESTRICT,
    CONSTRAINT "FK_SeriesGenres_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SeriesGenres_SeriesId_GenreId" ON "SeriesGenres" ("SeriesId", "GenreId");
CREATE INDEX IF NOT EXISTS "IX_SeriesGenres_GenreId" ON "SeriesGenres" ("GenreId");

-- 10. Bảng ProposalPages
CREATE TABLE IF NOT EXISTS "ProposalPages" (
    "ProposalPageId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "PageNo" integer NOT NULL,
    "PreviewFileAssetId" UUID NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_ProposalPages" PRIMARY KEY ("ProposalPageId"),
    CONSTRAINT "FK_ProposalPages_FileAssets_PreviewFileAssetId" FOREIGN KEY ("PreviewFileAssetId") REFERENCES "FileAssets" ("FileAssetId") ON DELETE RESTRICT,
    CONSTRAINT "FK_ProposalPages_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ProposalPages_PreviewFileAssetId" ON "ProposalPages" ("PreviewFileAssetId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ProposalPages_SeriesId_PageNo" ON "ProposalPages" ("SeriesId", "PageNo");

-- 11. Bảng BoardDecisions
CREATE TABLE IF NOT EXISTS "BoardDecisions" (
    "BoardDecisionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "DecisionType" character varying(50) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "Result" character varying(50) NULL,
    "VotingDeadline" timestamptz NOT NULL,
    "CreatedBy" UUID NULL,
    "ExtensionCount" integer NOT NULL DEFAULT 0,
    "ExtendedAt" timestamptz NULL,
    "ExtendedBy" UUID NULL,
    "ExtensionReason" character varying(1000) NULL,
    "SpecialDecisionAt" timestamptz NULL,
    "SpecialDecisionBy" UUID NULL,
    "SpecialDecisionReason" character varying(1000) NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_BoardDecisions" PRIMARY KEY ("BoardDecisionId"),
    CONSTRAINT "FK_BoardDecisions_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT,
    CONSTRAINT "FK_BoardDecisions_Users_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_BoardDecisions_CreatedBy" ON "BoardDecisions" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_BoardDecisions_SeriesId" ON "BoardDecisions" ("SeriesId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_BoardDecisions_OpenSeriesProposal_SeriesId" ON "BoardDecisions" ("SeriesId", "DecisionType", "Status") 
WHERE "DecisionType" = 'SeriesProposal' AND "Status" = 'Open' AND "DeletedAt" IS NULL;

-- 12. Bảng BoardVotes
CREATE TABLE IF NOT EXISTS "BoardVotes" (
    "BoardVoteId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "BoardDecisionId" UUID NOT NULL,
    "VoterId" UUID NOT NULL,
    "VoteValue" boolean NOT NULL,
    "VotedAt" timestamptz NOT NULL DEFAULT now(),
    "Comment" character varying(1000) NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_BoardVotes" PRIMARY KEY ("BoardVoteId"),
    CONSTRAINT "FK_BoardVotes_BoardDecisions_BoardDecisionId" FOREIGN KEY ("BoardDecisionId") REFERENCES "BoardDecisions" ("BoardDecisionId") ON DELETE RESTRICT,
    CONSTRAINT "FK_BoardVotes_Users_VoterId" FOREIGN KEY ("VoterId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_BoardVotes_BoardDecisionId_VoterId" ON "BoardVotes" ("BoardDecisionId", "VoterId");
CREATE INDEX IF NOT EXISTS "IX_BoardVotes_VoterId" ON "BoardVotes" ("VoterId");

-- 13. Bảng Chapters
CREATE TABLE IF NOT EXISTS "Chapters" (
    "ChapterId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "ChapterNo" integer NOT NULL,
    "Title" character varying(150) NOT NULL,
    "TotalPages" integer NOT NULL,
    "Status" character varying(50) NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Chapters" PRIMARY KEY ("ChapterId"),
    CONSTRAINT "FK_Chapters_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Chapters_SeriesId_ChapterNo" ON "Chapters" ("SeriesId", "ChapterNo");

-- 14. Bảng ChapterPages
CREATE TABLE IF NOT EXISTS "ChapterPages" (
    "ChapterPageId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ChapterId" UUID NOT NULL,
    "PageNo" integer NOT NULL,
    "ImageFileAssetId" UUID NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_ChapterPages" PRIMARY KEY ("ChapterPageId"),
    CONSTRAINT "FK_ChapterPages_Chapters_ChapterId" FOREIGN KEY ("ChapterId") REFERENCES "Chapters" ("ChapterId") ON DELETE RESTRICT,
    CONSTRAINT "FK_ChapterPages_FileAssets_ImageFileAssetId" FOREIGN KEY ("ImageFileAssetId") REFERENCES "FileAssets" ("FileAssetId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ChapterPages_ChapterId_PageNo" ON "ChapterPages" ("ChapterId", "PageNo");
CREATE INDEX IF NOT EXISTS "IX_ChapterPages_ImageFileAssetId" ON "ChapterPages" ("ImageFileAssetId");

-- 15. Bảng Manuscripts
CREATE TABLE IF NOT EXISTS "Manuscripts" (
    "ManuscriptId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ChapterId" UUID NOT NULL,
    "VersionNo" integer NOT NULL,
    "FileUrl" character varying(1000) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "Feedback" character varying(1000) NULL,
    "RevisionCount" integer NOT NULL DEFAULT 0,
    "SubmittedAt" timestamptz NOT NULL DEFAULT now(),
    "ReviewedBy" UUID NULL,
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Manuscripts" PRIMARY KEY ("ManuscriptId"),
    CONSTRAINT "FK_Manuscripts_Chapters_ChapterId" FOREIGN KEY ("ChapterId") REFERENCES "Chapters" ("ChapterId") ON DELETE RESTRICT,
    CONSTRAINT "FK_Manuscripts_Users_ReviewedBy" FOREIGN KEY ("ReviewedBy") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Manuscripts_ChapterId_VersionNo" ON "Manuscripts" ("ChapterId", "VersionNo");
CREATE INDEX IF NOT EXISTS "IX_Manuscripts_ReviewedBy" ON "Manuscripts" ("ReviewedBy");

-- 16. Bảng PageTasks
CREATE TABLE IF NOT EXISTS "PageTasks" (
    "PageTaskId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ChapterId" UUID NOT NULL,
    "AssistantId" UUID NULL,
    "TaskType" character varying(50) NOT NULL,
    "Description" character varying(1000) NULL,
    "Status" character varying(50) NOT NULL,
    "PageStart" integer NOT NULL,
    "PageEnd" integer NOT NULL,
    "ManuscriptId" UUID NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_PageTasks" PRIMARY KEY ("PageTaskId"),
    CONSTRAINT "FK_PageTasks_Chapters_ChapterId" FOREIGN KEY ("ChapterId") REFERENCES "Chapters" ("ChapterId") ON DELETE RESTRICT,
    CONSTRAINT "FK_PageTasks_Users_AssistantId" FOREIGN KEY ("AssistantId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "FK_PageTasks_Manuscripts_ManuscriptId" FOREIGN KEY ("ManuscriptId") REFERENCES "Manuscripts" ("ManuscriptId") ON DELETE RESTRICT,
    CONSTRAINT "CK_PageTasks_PageRange" CHECK ("PageStart" <= "PageEnd")
);
CREATE INDEX IF NOT EXISTS "IX_PageTasks_AssistantId" ON "PageTasks" ("AssistantId");
CREATE INDEX IF NOT EXISTS "IX_PageTasks_ChapterId" ON "PageTasks" ("ChapterId");
CREATE INDEX IF NOT EXISTS "IX_PageTasks_ManuscriptId" ON "PageTasks" ("ManuscriptId");

-- 17. Bảng PageTaskSubmissions
CREATE TABLE IF NOT EXISTS "PageTaskSubmissions" (
    "SubmissionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "PageTaskId" UUID NOT NULL,
    "VersionNo" integer NOT NULL,
    "SubmittedFileAssetId" UUID NOT NULL,
    "Status" character varying(50) NOT NULL,
    "RejectReason" character varying(1000) NULL,
    "Note" character varying(1000) NULL,
    "SubmittedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_PageTaskSubmissions" PRIMARY KEY ("SubmissionId"),
    CONSTRAINT "FK_PageTaskSubmissions_FileAssets_SubmittedFileAssetId" FOREIGN KEY ("SubmittedFileAssetId") REFERENCES "FileAssets" ("FileAssetId") ON DELETE RESTRICT,
    CONSTRAINT "FK_PageTaskSubmissions_PageTasks_PageTaskId" FOREIGN KEY ("PageTaskId") REFERENCES "PageTasks" ("PageTaskId") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_PageTaskSubmissions_PageTaskId_VersionNo" ON "PageTaskSubmissions" ("PageTaskId", "VersionNo");
CREATE INDEX IF NOT EXISTS "IX_PageTaskSubmissions_SubmittedFileAssetId" ON "PageTaskSubmissions" ("SubmittedFileAssetId");

-- 18. Bảng Annotations
CREATE TABLE IF NOT EXISTS "Annotations" (
    "AnnotationId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ManuscriptId" UUID NOT NULL,
    "AuthorId" UUID NOT NULL,
    "PositionX" numeric(18,4) NOT NULL,
    "PositionY" numeric(18,4) NOT NULL,
    "Content" text NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Annotations" PRIMARY KEY ("AnnotationId"),
    CONSTRAINT "FK_Annotations_Manuscripts_ManuscriptId" FOREIGN KEY ("ManuscriptId") REFERENCES "Manuscripts" ("ManuscriptId") ON DELETE RESTRICT,
    CONSTRAINT "FK_Annotations_Users_AuthorId" FOREIGN KEY ("AuthorId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_Annotations_AuthorId" ON "Annotations" ("AuthorId");
CREATE INDEX IF NOT EXISTS "IX_Annotations_ManuscriptId" ON "Annotations" ("ManuscriptId");

-- 19. Bảng VoteRecords
CREATE TABLE IF NOT EXISTS "VoteRecords" (
    "VoteRecordId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "Period" character varying(50) NOT NULL,
    "ReaderCount" integer NOT NULL,
    "VoteCount" integer NOT NULL,
    "Status" character varying(50) NOT NULL,
    "ConfirmedBy" UUID NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_VoteRecords" PRIMARY KEY ("VoteRecordId"),
    CONSTRAINT "FK_VoteRecords_Users_ConfirmedBy" FOREIGN KEY ("ConfirmedBy") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "FK_VoteRecords_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT,
    CONSTRAINT "CK_VoteRecords_Count" CHECK ("VoteCount" <= "ReaderCount")
);
CREATE INDEX IF NOT EXISTS "IX_VoteRecords_ConfirmedBy" ON "VoteRecords" ("ConfirmedBy");
CREATE INDEX IF NOT EXISTS "IX_VoteRecords_SeriesId" ON "VoteRecords" ("SeriesId");

-- 20. Bảng RankingSnapshots
CREATE TABLE IF NOT EXISTS "RankingSnapshots" (
    "RankingSnapshotId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "Period" character varying(50) NOT NULL,
    "IsBottom20Percent" boolean NOT NULL DEFAULT FALSE,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_RankingSnapshots" PRIMARY KEY ("RankingSnapshotId"),
    CONSTRAINT "FK_RankingSnapshots_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_RankingSnapshots_SeriesId" ON "RankingSnapshots" ("SeriesId");

-- 21. Bảng Escalations
CREATE TABLE IF NOT EXISTS "Escalations" (
    "EscalationId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "SeriesId" UUID NOT NULL,
    "Type" character varying(50) NOT NULL,
    "EntityType" character varying(50) NOT NULL,
    "Priority" character varying(50) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "Reason" character varying(1000) NOT NULL,
    "Resolution" character varying(1000) NULL,
    "CreatedBy" UUID NOT NULL,
    "ResolvedBy" UUID NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz NULL,
    CONSTRAINT "PK_Escalations" PRIMARY KEY ("EscalationId"),
    CONSTRAINT "FK_Escalations_Users_CreatedBy" FOREIGN KEY ("CreatedBy") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "FK_Escalations_Users_ResolvedBy" FOREIGN KEY ("ResolvedBy") REFERENCES "Users" ("UserId") ON DELETE RESTRICT,
    CONSTRAINT "FK_Escalations_Series_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "Series" ("SeriesId") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_Escalations_CreatedBy" ON "Escalations" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_Escalations_ResolvedBy" ON "Escalations" ("ResolvedBy");
CREATE INDEX IF NOT EXISTS "IX_Escalations_SeriesId" ON "Escalations" ("SeriesId");
