# BÁO CÁO KẾT QUẢ KIỂM THỬ (TEST REPORT)

* **Tên Dự Án:** Hệ thống Quản lý Truyện tranh (Manga Management System - MMS)
* **Mã Dự Án:** MMS
* **Ngày Kiểm Thử:** 04/07/2026
* **Người Kiểm Thử:** QA / AI Verification Agent
* **Trạng Thái Tổng Thể:** 100% PASSED (Đạt 23/23 Test Cases)

---

## I. BẢNG TỔNG HỢP THỐNG KÊ (TEST STATISTICS SUMMARY)

| STT | Phân Hệ / Tính Năng (Feature Area) | Tổng số TC | Đạt (Passed) | Thất bại (Failed) | Chờ duyệt (Pending) | N/A | Tỷ Lệ Đạt (Pass Rate) |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Feature 1: Đề xuất tác phẩm & Bỏ phiếu** | 14 | 14 | 0 | 0 | 0 | 100% |
| 2 | **Feature 2: Tạo Chapter & Giao việc cho Trợ lý** | 9 | 9 | 0 | 0 | 0 | 100% |
| **Tổng** | | **23** | **23** | **0** | **0** | **0** | **100%** |

---

## II. CHI TIẾT KẾT QUẢ TỪNG TEST CASE

### FEATURE 1: Đề xuất tác phẩm & Bỏ phiếu (Series Proposal & Board Voting)

| ID | Tên Kịch Bản Kiểm Thử (Description) | Quy Trình Thực Hiện (Test Procedure) | Kết Quả Kỳ Vọng (Expected Results) | Trạng Thái | Ghi Chú Kỹ Thuật |
|:---|:---|:---|:---|:---:|:---|
| **TC-01** | Kiểm tra quyền truy cập trang Tạo Đề xuất truyện khi chưa đăng nhập. | Truy cập trực tiếp địa chỉ `/dashboard/series/new` trên trình duyệt khi chưa có token đăng nhập. | Hệ thống chặn truy cập và tự động chuyển hướng người dùng về trang đăng nhập `/login`. | **PASSED** | Ràng buộc bảo mật qua API client interceptor (`lib/api.ts`). |
| **TC-02** | Kiểm tra quyền truy cập trang Tạo Đề xuất truyện bằng tài khoản không phải Mangaka (ví dụ: Editor). | Đăng nhập tài khoản Editor (TantouEditor), truy cập `/dashboard/series/new`. | Hệ thống từ chối truy cập, hiển thị trang lỗi "Access Denied" (Chỉ Mangaka mới được tạo đề xuất). | **PASSED** | Kiểm soát phân quyền qua `RoleContext` tại `app/dashboard/series/new/page.tsx` dòng 125. |
| **TC-03** | Kiểm tra các trường bắt buộc và cảnh báo validation mặc định khi nộp form trống. | Nhấn nút "Submit for Review" khi chưa điền thông tin đề xuất. | - Hệ thống chặn không cho gửi đề xuất.<br>- Hiện viền đỏ cảnh báo lỗi dưới các ô Title, Genre, Synopsis, Sample Pages. | **PASSED** | Thực thi qua thư viện React Hook Form + Zod Schema. |
| **TC-04** | Kiểm tra độ dài Synopsis tối thiểu (< 200 ký tự). | Nhập Synopsis ngắn hơn 200 ký tự và nhấn gửi duyệt. | - Hiển thị lỗi "Synopsis must be ≥ 200 characters".<br>- Thanh đo tiến độ ký tự đổi màu vàng/cam.<br>- Chặn nộp đề xuất. | **PASSED** | Kiểm tra độ dài tự động qua quy tắc Zod validation. |
| **TC-05** | Kiểm tra độ dài Synopsis tối đa (> 2000 ký tự). | Nhập Synopsis dài hơn 2000 ký tự. | - Hiển thị lỗi "Synopsis must be ≤ 2000 characters".<br>- Thanh tiến độ ký tự đổi sang màu đỏ và chặn nộp đề xuất. | **PASSED** | Tối đa 2000 ký tự được cấu hình trong `lib/validation.ts`. |
| **TC-06** | Kiểm tra ràng buộc phải có tối thiểu 5 trang truyện mẫu (Sample Pages). | Tải lên ít hơn 5 trang ảnh truyện mẫu (chọn 3 trang) và nhấn gửi. | - Hiển thị cảnh báo yêu cầu tải lên đủ 5 trang ảnh mẫu.<br>- Không cho phép gửi đề xuất. | **PASSED** | Kiểm tra mảng `sampleImages` trong form trước khi upload. |
| **TC-07** | Kiểm tra luật nghiệp vụ (BR-17) trùng tên tác phẩm đang hoạt động. | Nhập tiêu đề đề xuất trùng khớp chính xác với một Series đang hoạt động. | - Hệ thống kiểm tra và báo lỗi: "Title '...' is already used by an active series".<br>- Chặn nộp đề xuất. | **PASSED** | Logic xác thực thông qua API `isTitleDuplicate` của `proposals-store.ts`. |
| **TC-08** | Kiểm tra luật nghiệp vụ (BR-19) giới hạn tối đa 1 đề xuất đang chờ duyệt cùng lúc. | Truy cập trang tạo mới khi tài khoản đã có 1 đề xuất ở trạng thái `Pending Review` hoặc `Under Review`. | - Hiển thị banner cảnh báo: "Active proposal already exists".<br>- Vô hiệu hóa (disable) cả 2 nút Lưu nháp & Gửi duyệt. | **PASSED** | Kiểm tra qua hàm `hasPendingProposal` trên giao diện Mangaka. |
| **TC-09** | Kiểm tra tính năng Lưu Nháp (Save Draft). | Nhập tiêu đề, để trống hoặc nhập dở dang các trường khác, nhấn "Save Draft". | - Bỏ qua toàn bộ ràng buộc độ dài và bắt buộc.<br>- Lưu đề xuất thành công với trạng thái `Draft` (xám) và chuyển hướng về danh sách. | **PASSED** | Action `draft` tự động gán giá trị giả lập để bypass Zod validation. |
| **TC-10** | Kiểm tra quy trình nộp đề xuất thành công (Happy Path). | Điền đầy đủ thông tin hợp lệ, tải lên đủ 5 trang truyện mẫu, nhấn "Submit for Review". | - Upload ảnh lên storage thành công.<br>- Đề xuất được tạo với trạng thái `Pending Review` (vàng).<br>- Tự động gửi thông báo cho Ban biên tập. | **PASSED** | Tạo thành công đối tượng `Proposal` và gửi notification. |
| **TC-11** | Kiểm tra xử lý lỗi khi mất kết nối mạng giả lập trong quá trình nộp đề xuất. | Nhấn gửi và giả lập tình huống mất mạng API. | - Hiện spinner xoay 1 giây.<br>- Hiển thị thông báo "Connection error or timeout...".<br>- Form giữ nguyên dữ liệu vừa nhập. | **PASSED** | Bắt lỗi trực tiếp thông qua khối try-catch trong form submit. |
| **TC-12** | Kiểm tra Tantou Editor mở phiên bỏ phiếu duyệt đề xuất. | Biên tập viên xem đề xuất ở trạng thái `Pending Review`, nhấn "Approve & Submit to Board". | - Trạng thái đề xuất đổi sang `Under Review`.<br>- Phiên bỏ phiếu (Board Decision) được kích hoạt cho Ban biên tập. | **PASSED** | Xử lý trong `app/dashboard/tantou-editor/page.tsx` dòng 1441. |
| **TC-13** | Kiểm tra thành viên Ban biên tập thực hiện bỏ phiếu (Vote). | Thành viên Ban biên tập chọn phiếu Approve/Reject kèm lý do và nhấn gửi. | - Phiếu bầu được lưu thành công.<br>- Trình duyệt ẩn nút bỏ phiếu cho thành viên này để tránh bỏ phiếu trùng lặp. | **PASSED** | Kiểm tra biến `alreadyVoted` trong `reviews/page.tsx` dòng 786. |
| **TC-14** | Kiểm tra chốt quyết định cuối cùng (Finalize Board Decision). | Đề xuất đạt đủ số phiếu tối thiểu (quorum >= 3). Biên tập viên nhấn "Activate Series". | - Trạng thái đề xuất đổi thành `Active` (Series chính thức hoạt động).<br>- Tạo thực thể Series mới trong hệ thống. | **PASSED** | Xử lý chốt trạng thái trong `tantou-editor/page.tsx` dòng 1491. |

---

### FEATURE 2: Tạo Chapter & Giao việc cho Trợ lý (Chapter & Assistant Task Workflow)

| ID | Tên Kịch Bản Kiểm Thử (Description) | Quy Trình Thực Hiện (Test Procedure) | Kết Quả Kỳ Vọng (Expected Results) | Trạng Thái | Ghi Chú Kỹ Thuật |
|:---|:---|:---|:---|:---:|:---|
| **TC-15** | Kiểm tra Mangaka tạo thành công một Chapter mới. | Mangaka nhấn "Create Chapter", điền thông tin số chương, tên chương, nộp bản vẽ thô và nhấn lưu. | - Chapter được tạo thành công với trạng thái mặc định là `Draft` (xám).<br>- Tự động tính hạn chót (deadline) nộp bản thảo. | **PASSED** | Thực thi qua `createChapter` với giá trị mặc định `Draft` trong `chapters/page.tsx`. |
| **TC-16** | Kiểm tra Mangaka tạo Task vẽ trang và giao việc cho Trợ lý. | Chọn một chapter, nhấn "Create Task", điền khoảng trang, chọn tên Trợ lý và nhấn tạo. | - Task được tạo với trạng thái ban đầu là `Pending`.<br>- Trạng thái Chapter đổi từ `Draft` sang `In Progress` (xanh dương). | **PASSED** | Kiểm tra và cập nhật trạng thái chapter tự động ở dòng 559. |
| **TC-17** | Kiểm tra Trợ lý xem và nhận công việc được giao. | Trợ lý đăng nhập, xem danh sách nhiệm vụ được giao, nhấn "Accept & Start". | - Trạng thái Task chuyển từ `Pending` sang `In-Progress`. | **PASSED** | Xử lý qua hàm `handleStartTask` cập nhật trạng thái nhiệm vụ. |
| **TC-18** | Kiểm tra Trợ lý nộp sản phẩm hoàn thành. | Trợ lý nhấn "Submit Finished Work", dán link ảnh sản phẩm và ghi bình luận rồi nhấn gửi. | - Trạng thái Task chuyển sang `Submitted`.<br>- Link sản phẩm được lưu lại hiển thị cho Mangaka xem xét. | **PASSED** | Xử lý qua hàm `handleSubmitWork` cập nhật trạng thái nhiệm vụ. |
| **TC-19** | Kiểm tra Mangaka từ chối bài nộp của Trợ lý (Reject). | Mangaka xem sản phẩm, nhấn "Reject", ghi lý do yêu cầu sửa đổi và nhấn xác nhận. | - Trạng thái Task chuyển thành `Rejected`.<br>- Lời phản hồi được hiển thị cho Trợ lý.<br>- Chapter giữ nguyên trạng thái `In Progress`. | **PASSED** | Logic từ chối nhiệm vụ tại `chapters/page.tsx` dòng 582. |
| **TC-20** | Kiểm tra Trợ lý vẽ lại và nộp lại nhiệm vụ bị từ chối. | Trợ lý đọc feedback yêu cầu sửa đổi, chỉnh sửa xong dán link mới và nhấn gửi lại. | - Trạng thái Task chuyển từ `Rejected` trở lại `Submitted` để chờ Mangaka đánh giá lại. | **PASSED** | Hỗ trợ nộp lại và cập nhật link sản phẩm khi nhiệm vụ có trạng thái `Rejected`. |
| **TC-21** | Kiểm tra Mangaka phê duyệt bài nộp của Trợ lý (Approve). | Mangaka duyệt bài vẽ, chọn "Approve". | - Trạng thái Task đổi sang `Approved`.<br>- Phần trăm tiến độ hoàn thành của Chapter tăng lên dựa trên số trang được duyệt. | **PASSED** | Tiến độ cập nhật thông qua hàm `countUniqueApprovedPages` và `calculateChapterProgress`. |
| **TC-22** | Kiểm tra trạng thái Chapter cập nhật khi tất cả các Task được duyệt. | Xác nhận tất cả các trang vẽ trong chapter đều ở trạng thái Approved (tiến độ 100%). | - Tiến độ hiển thị 100%.<br>- Nút "Submit to Editor" xuất hiện để Mangaka chuyển đổi trạng thái chapter thành `Ready for Editor`. | **PASSED** | Điều kiện kiểm tra tiến độ chapter đạt 100% tại dòng 876. |
| **TC-23** | Kiểm tra Biên tập viên xem tiến độ và viết phản hồi cho Chapter. | Biên tập viên đăng nhập, xem chapter ở trạng thái `Ready for Editor`, xem tranh và ghi chú thích/góp ý. | - Các phản hồi/chú thích của biên tập được lưu trữ thành công.<br>- Trạng thái hiển thị để Mangaka biết và tinh chỉnh trước khi xuất bản. | **PASSED** | Dashboard của biên tập viên lấy ra các chapter ở trạng thái `Ready for Editor` để review. |
