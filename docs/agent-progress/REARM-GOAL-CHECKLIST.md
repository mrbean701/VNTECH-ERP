# 🔧 QUY TRÌNH REARM MỤC TIÊU (đọc ĐẦU TIÊN sau mỗi lần DSH khởi động lại)

## Triệu chứng
Vòng lặp tự động **DỪNG sau mỗi lượt** dù MASTER TASK chưa xong.

## Chẩn đoán (gọi get_goal)
Nếu "activation": "disarmed" ⇒ **đó là nguyên nhân**.
(phase: active + maxGoalRounds đủ lớn KHÔNG cứu được — trần hiện tại là 1200.)

## Sửa (BẮT BUỘC ở LƯỢT NGƯỜI DÙNG TRỰC TIẾP)
1. Gọi get_goal ⇒ lấy **goal_id** + **revision** hiện tại.
2. Gọi update_goal action="resume" với đúng goal_id + evision.
3. Kiểm lại: ctivation phải là **rmed**.

## Điều KHÔNG được làm
* Nếu lượt hiện tại là **goal_round (tự động)**, lệnh esume sẽ bị từ chối:
  Error: this goal operation requires a direct human turn on a top-level agent
  ⇒ **KHÔNG thử lại vô ích**; hãy nhờ người dùng gửi **1 tin nhắn trực tiếp**.
* KHÔNG sửa file .agent-teams/plugin để lách; KHÔNG tự kết thúc session.

## Giảm thiệt hại (luôn làm, không phụ thuộc rearm)
* **Commit + ghi hồ sơ cuối MỖI lượt** ⇒ dừng giữa chừng cũng không mất việc.
* **Chia nhỏ lệnh** — tránh 1 lệnh gồm nhiều việc dài (dễ bị ngắt giữa chừng).
* **Ghi checkpoint** cuối lượt: CURRENT / STEP / REMAINING / NEXT ACTION / BLOCKER.