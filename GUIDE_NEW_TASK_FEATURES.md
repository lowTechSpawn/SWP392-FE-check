# Hướng Dẫn Tính Năng: Nâng Cấp Task & Quy Trình Nộp Bài Assistant

Tài liệu này hướng dẫn chi tiết cách sử dụng, kiểm thử và cấu trúc của các tính năng nâng cấp vừa được phát triển trong hệ thống quản lý Task của Mangaka và luồng làm việc của Assistant.

---

## 1. Các Tính Năng Mới Được Thêm Vào

### A. Giao diện Tạo Task (Vai trò: Mangaka)
1. **Chọn nhiều Task Type cùng lúc**: Thay vì chỉ chọn được một loại công việc, Mangaka giờ đây có thể chọn nhiều loại bằng Checkbox (VD: `Line Art`, `Coloring`, `Background Art`, `Screentoning`, `Clean-up`).
2. **Nhập Page Start & Page End**: Thay thế ô nhập text tự do bằng hai ô số riêng biệt là **Page Start** và **Page End**. Hệ thống tự động kiểm tra logic (Trang bắt đầu không được lớn hơn trang kết thúc).
3. **Due Date (Hạn nộp)**: Thêm ô chọn ngày (date picker) để Mangaka chỉ định rõ thời hạn hoàn thành công việc cho Assistant.
4. **Reference Files (Tài liệu đính kèm)**: Khu vực tải lên các file hướng dẫn hoặc ảnh mẫu phác thảo cho Assistant. Người dùng có thể click **Attach Mock File** để mô phỏng việc upload nhiều tài liệu.

### B. Giao diện Quản lý Task (Vai trò: Assistant)
1. **Hiển thị Tên Manga**: Mỗi thẻ công việc của Assistant giờ đây tự động hiển thị tên Manga Series tương ứng ở dòng đầu tiên (VD: `Manga: Sakura Knights — Ch. 2: Cherry Blossom Magitech`).
2. **Hiển thị Due Date**: Hiển thị thẻ màu cam thông báo hạn nộp task rõ ràng (`📅 Hạn chót: YYYY-MM-DD`).
3. **Nút View Details (Xem chi tiết - Read-only)**:
   - Assistant có thể click vào nút **View Details** để mở cửa sổ xem toàn bộ thông tin chi tiết mà Mangaka đã giao (Tên Manga, Chapter, các loại Task, dải trang, hạn nộp, mô tả chỉ dẫn chi tiết, và danh sách các file hướng dẫn vẽ đính kèm).
   - Cửa sổ này ở chế độ **Read-only (Chỉ xem)** để đảm bảo Assistant không thay đổi dữ liệu gốc.
4. **Nộp bài vẽ kèm File & Mô tả chỉnh sửa**:
   - Khi nhấn **Submit Finished Work**, Assistant có thể đính kèm nhiều file vẽ sản phẩm bằng cách nhấn nút **Attach Work File** (giả lập tải lên file hình ảnh/zip).
   - Có thêm ô **Description & Comments for Mangaka** để Assistant mô tả chi tiết những gì đã chỉnh sửa hoặc để lại lời nhắn cho Mangaka.

### C. Giao diện Phê duyệt Bài làm (Vai trò: Mangaka)
1. Khi Mangaka nhấn **Review Submission**, cửa sổ phê duyệt sẽ hiển thị:
   - Hình ảnh bài vẽ preview.
   - Danh sách cụ thể các file vẽ sản phẩm mà Assistant đã nộp.
   - Nội dung mô tả chi tiết chỉnh sửa từ Assistant.
   - Ô nhập feedback và nút Approve/Reject như trước.

---

## 2. Hướng Dẫn Chạy Thử Nghiệm Luồng Công Việc (Step-by-Step Demo)

Hãy thực hiện các bước sau trực tiếp trên giao diện [http://localhost:3000/dashboard/chapters](http://localhost:3000/dashboard/chapters):

### Bước 1: Giao việc nâng cao (Vai trò: Mangaka)
1. Chọn vai trò **Mangaka** tại Sidebar.
2. Chọn một Chapter hiện có (hoặc tạo mới).
3. Nhấn **Add Task** để mở modal giao việc mới:
   - Tích chọn đồng thời: `Coloring` và `Background Art`.
   - Nhập Page Start: `2`, Page End: `6`.
   - Chọn một ngày bất kỳ làm Hạn nộp (Due Date).
   - Click nút **Attach Mock File** 2 lần để đính kèm 2 file hướng dẫn vẽ.
   - Nhập mô tả công việc ở ô Instruction.
   - Chọn Assistant là **Sato Takashi**.
   - Nhấn **Assign Task**.
4. Xác nhận task mới xuất hiện trong danh sách hiển thị đúng dạng: `Coloring, Background Art (Pages 2-6)`.

### Bước 2: Nhận việc & Xem chi tiết & Nộp bài (Vai trò: Assistant)
1. Chọn vai trò **Assistant** tại Sidebar.
2. Chọn Profile **Sato Takashi** ở thanh chọn phía trên.
3. Tìm thẻ task vừa giao:
   - Xác nhận tên Manga (`Sakura Knights`...) và Hạn chót hiển thị rõ ràng.
   - Nhấn nút **View Details**: kiểm tra xem toàn bộ thông tin có hiển thị đầy đủ và không thể chỉnh sửa hay không. Nhấn Close để đóng modal.
4. Nhấn nút **Accept & Start** để chuyển trạng thái sang `In-Progress`.
5. Nhấn nút **Submit Finished Work** để nộp bài vẽ:
   - Click nút **Attach Work File** 2 lần để tải lên các file sản phẩm đã vẽ.
   - Nhập nội dung mô tả chỉnh sửa ở ô mô tả bên dưới (VD: "Đã tô màu bóng hoàng hôn và vẽ chi tiết gạch nền").
   - Nhấn **Submit Deliverable**.

### Bước 3: Xem file nộp & Phê duyệt (Vai trò: Mangaka)
1. Chuyển lại vai trò **Mangaka**.
2. Chọn Chapter tương ứng và tìm task của Sato Takashi đang ở trạng thái `Submitted`.
3. Nhấp nút **Review Submission**:
   - Kiểm tra xem danh sách các file nộp của Assistant có hiển thị đúng góc dưới bên trái không.
   - Kiểm tra xem lời nhắn mô tả của Assistant có hiển thị đầy đủ ở phần **Assistant Notes & Edits** không.
   - Nhập feedback và nhấn **Approve & Sign-off** để hoàn tất.
