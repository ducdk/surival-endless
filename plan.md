# 📌 Kế hoạch phát triển game web: Endless Survival

## 🎯 Mục tiêu chính
Tạo một game survival endless chơi trên web, nơi người chơi điều khiển một nhân vật chiến đấu với quái vật không ngừng sinh ra để thu thập tài nguyên, tăng cấp, nâng trang bị và sống sót lâu nhất có thể.

---

## 🧩 Cốt lõi Gameplay

### 1. Nhân vật chính
- **Thuộc tính cơ bản**: Máu, Sát thương, Tốc đánh, Phạm vi, Tốc độ di chuyển.
- **Cấp độ (Level)**: Tăng khi đạt ngưỡng kinh nghiệm (chỉ trong lượt chơi hiện tại).
- **Trang bị**: Có thể nâng cấp giữa các lượt chơi (giữ nguyên sau mỗi lượt).

### 2. Vật phẩm & Tài nguyên

| Vật phẩm     | Tác dụng trong lượt chơi          | Tác dụng ngoài lượt |
|--------------|-----------------------------------|----------------------|
| 🩸 Hồi máu    | Hồi máu tức thời                  | Không                |
| 🪙 Vàng       | Không                             | Dùng nâng cấp trang bị |
| 🌟 Kinh nghiệm| Tăng level trong lượt chơi        | Không                |

---

## 👾 Hệ thống Quái vật

- Tự sinh ra theo thời gian (spawn timer).
- Tự tìm đến và tấn công nhân vật.
- Các loại quái:
  - **Bình thường**: Sát thương thấp, máu thấp.
  - **Tanker**: Máu trâu, tốc độ chậm.
  - **Fast**: Tốc độ cao, máu thấp.
  - **Ranged**: Tấn công từ xa.
  - **Elite/Boss**: Xuất hiện theo thời gian/lượt.

### Quái vật chết
- Có tỉ lệ rơi:
  - Máu: 20%
  - Kinh nghiệm: 100%
  - Vàng: 50%

---

## 🔁 Vòng lặp chơi (Gameplay Loop)

1. Người chơi bắt đầu lượt chơi.
2. Quái bắt đầu spawn liên tục.
3. Nhân vật tự động tấn công hoặc điều khiển tấn công.
4. Nhặt tài nguyên rơi ra từ quái.
5. Khi nhân vật hết máu → kết thúc lượt.
6. Dùng vàng kiếm được để nâng cấp:
   - Trang bị mới / cải thiện chỉ số
   - Kỹ năng bị động
7. Bắt đầu lượt mới (quái mạnh hơn dần theo thời gian/lượt).

---

## 📊 Cấp độ và nâng cấp

### Cấp trong lượt chơi
- Mỗi lần lên cấp, cho chọn:
  - Tăng máu
  - Tăng sát thương
  - Hồi máu một phần
  - Tăng tốc đánh

### Trang bị giữ sau lượt chơi
- Vũ khí, áo giáp, phụ kiện
- Có thể mua/nâng cấp giữa các lượt bằng vàng
- Mỗi trang bị có chỉ số riêng + kỹ năng bị động

---

## 🛠️ Công nghệ đề xuất

| Thành phần          | Công nghệ                                       |
|---------------------|-------------------------------------------------|
| Frontend Game       | HTML5 Canvas hoặc WebGL (Three.js / Phaser.js) |
| Logic Game          | JavaScript hoặc TypeScript                      |
| Backend (tuỳ chọn)  | Node.js + Express (để lưu tài khoản, tiến trình)|
| Cơ sở dữ liệu       | MongoDB hoặc Firebase Realtime/Firestore        |
| Asset & Art         | Pixel art hoặc low-poly style                   |

---

## 🧱 Kiến trúc hệ thống (nếu có backend)

- **Frontend**: Game chạy hoàn toàn trong trình duyệt.
- **Backend**: Lưu thông tin nhân vật, trang bị, vàng.
- **Realtime (tùy chọn)**: Để tạo leaderboard, người chơi cạnh tranh thời gian sống sót lâu nhất.

---

## 🎮 Gợi ý phát triển theo giai đoạn

| Giai đoạn      | Mục tiêu chính                                      |
|----------------|-----------------------------------------------------|
| Giai đoạn 1    | Nhân vật + quái vật sinh ra + đánh cơ bản + lên level |
| Giai đoạn 2    | Hệ thống rơi đồ (máu, vàng, xp) + giao diện UI      |
| Giai đoạn 3    | Nâng cấp trang bị giữa lượt + lưu dữ liệu nhân vật |
| Giai đoạn 4    | Thêm boss, kỹ năng, hiệu ứng                        |
| Giai đoạn 5    | Tối ưu hóa UI, cân bằng game, test người dùng      |