-- 1. Seed Roles (Bắt buộc dùng chính xác các UUID này để khớp FE)
INSERT INTO "Roles" ("RoleId", "RoleName") VALUES
('BE9F220B-48DA-441F-9201-4B7F2A97C99B', 'Admin'),
('A5B9C8E7-1234-4567-89AB-CDEF01234567', 'Mangaka'),
('B6C7D8E9-2345-5678-90AB-CDEF01234568', 'TantouEditor'),
('C7D8E9F0-3456-6789-01AB-CDEF01234569', 'EditorialBoard'),
('D8E9F0A1-4567-7890-12AB-CDEF01234570', 'EditorInChief'),
('E9F0A1B2-5678-8901-23AB-CDEF01234571', 'Assistant')
ON CONFLICT ("RoleId") DO NOTHING;

-- 2. Seed Users mẫu từ bảng hình ảnh (Mật khẩu được mã hóa bảo mật theo thuật toán ASP.NET Core)
INSERT INTO "Users" ("UserId", "RoleId", "UserName", "Email", "DisplayName", "PasswordHash", "CreatedAt") VALUES
-- Admin Accounts
('a0000000-0000-0000-0000-000000000001', 'BE9F220B-48DA-441F-9201-4B7F2A97C99B', 'tempadmin', 'tempadmin@gmail.com', 'Temp Admin', 'AQAAAAIAAYagAAAAECTBH8Fo+m/Cx0ZxKQ22cX+ztwl7qPQiqhiN3dRfP8Gr3+5xj+FmyGOiPFH0rVmmyQ==', now()),
('a0000000-0000-0000-0000-000000000002', 'BE9F220B-48DA-441F-9201-4B7F2A97C99B', 'new_admin', 'new_admin@manga.com', 'my_new_admin', 'AQAAAAIAAYagAAAAEF0ZGVDgJBMDaZcb+9qfOWQNmhaNOdrXOFh3Cv898eanNcqbz9KXVI8+0hFFQEjouQ==', now()),

-- Editor In Chief
('c0000000-0000-0000-0000-000000000001', 'D8E9F0A1-4567-7890-12AB-CDEF01234570', 'chief', 'chief@gmail.com', 'chief@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),

-- Editorial Board
('b0000000-0000-0000-0000-000000000001', 'C7D8E9F0-3456-6789-01AB-CDEF01234569', 'editorialboard', 'editorialboard@gmail.com', 'editorialBoard@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),

-- Tantou Editors
('e0000000-0000-0000-0000-000000000001', 'B6C7D8E9-2345-5678-90AB-CDEF01234568', 'tantou', 'tantou@gmail.com', 'tantou@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('e0000000-0000-0000-0000-000000000002', 'B6C7D8E9-2345-5678-90AB-CDEF01234568', 'nakamura', 'nakamura@mangaflow.com', 'nakamura@mangaflow.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('e0000000-0000-0000-0000-000000000003', 'B6C7D8E9-2345-5678-90AB-CDEF01234568', 'tantou321', 'tantou321@gmail.com', 'tantou321@gmail.com', 'AQAAAAIAAYagAAAAEImROQpszcPlbqb4kFKTbDq5f+XyiPwBnKu7Ps5jI2hChN5TLXxEwgBzXhL119AOlg==', now()),

-- Mangakas
('f0000000-0000-0000-0000-000000000001', 'A5B9C8E7-1234-4567-89AB-CDEF01234567', 'mangaka', 'mangaka@gmail.com', 'mangaka@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('f0000000-0000-0000-0000-000000000002', 'A5B9C8E7-1234-4567-89AB-CDEF01234567', 'oda_eiichiro_4170', 'oda_eiichiro_4170@gmail.com', 'Eiichiro Oda', 'AQAAAAIAAYagAAAAECTBH8Fo+m/Cx0ZxKQ22cX+ztwl7qPQiqhiN3dRfP8Gr3+5xj+FmyGOiPFH0rVmmyQ==', now()),

-- Assistants
('d0000000-0000-0000-0000-000000000001', 'E9F0A1B2-5678-8901-23AB-CDEF01234571', 'assistant1', 'assistant1@gmail.com', 'assistant1@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('d0000000-0000-0000-0000-000000000002', 'E9F0A1B2-5678-8901-23AB-CDEF01234571', 'assistant2', 'assistant2@gmail.com', 'assistant2@gmail.com', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('d0000000-0000-0000-0000-000000000003', 'E9F0A1B2-5678-8901-23AB-CDEF01234571', 'assistant231', 'assistant231@gmail.com', '12231', 'AQAAAAIAAYagAAAAEEqKdSXxT9DcNx1MfB+mW7XvJhNxio8JVLtGWnO6wi/AcNf+McxjLoBLTthegwTOZA==', now()),
('d0000000-0000-0000-0000-000000000004', 'E9F0A1B2-5678-8901-23AB-CDEF01234571', 'assistant2312', 'assistant2312@gmail.com', 'assistant2312@gmail.com', 'AQAAAAIAAYagAAAAEImROQpszcPlbqb4kFKTbDq5f+XyiPwBnKu7Ps5jI2hChN5TLXxEwgBzXhL119AOlg==', now()),
('d0000000-0000-0000-0000-000000000005', 'E9F0A1B2-5678-8901-23AB-CDEF01234571', 'assistant1432', 'assistant1432@gmail.com', 'assistant1432@gmail.com', 'AQAAAAIAAYagAAAAEImROQpszcPlbqb4kFKTbDq5f+XyiPwBnKu7Ps5jI2hChN5TLXxEwgBzXhL119AOlg==', now())
ON CONFLICT ("UserId") DO NOTHING;

-- 3. Gán Editor cho Mangaka (Để vượt qua validation BR-19/BR-15 khi tạo đề xuất)
INSERT INTO "UserAssignments" ("AssignmentId", "FromUserId", "ToUserId", "AssignedAt") VALUES
('11111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', now()), -- tantou@gmail.com quản lý mangaka@gmail.com
('22222222-2222-2222-2222-222222222222', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', now())  -- tantou@gmail.com quản lý Eiichiro Oda
ON CONFLICT ("AssignmentId") DO NOTHING;

-- 4. Seed Thể loại truyện (Genres)
INSERT INTO "Genres" ("GenreId", "Title") VALUES
('33333333-3333-3333-3333-333333333301', 'Action'),
('33333333-3333-3333-3333-333333333302', 'Drama'),
('33333333-3333-3333-3333-333333333303', 'Romance'),
('33333333-3333-3333-3333-333333333304', 'Fantasy'),
('33333333-3333-3333-3333-333333333305', 'Sci-Fi'),
('33333333-3333-3333-3333-333333333306', 'Comedy'),
('33333333-3333-3333-3333-333333333307', 'Thriller'),
('33333333-3333-3333-3333-333333333308', 'Horror'),
('33333333-3333-3333-3333-333333333309', 'Slice of Life'),
('33333333-3333-3333-3333-333333333310', 'Mystery')
ON CONFLICT ("GenreId") DO NOTHING;
