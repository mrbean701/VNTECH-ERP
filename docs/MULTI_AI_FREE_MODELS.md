# MULTI_AI_FREE_MODELS — Free Model Discovery Report

Theo `mutil AI.md` §11 (PATCH).

Tài liệu này đặt trong repo ERP để tiện theo dõi tiến độ. Tuy nhiên theo §25, **Worker Registry và
plugin router không nên nằm trong repo này** — chúng là infrastructure dùng chung cho mọi dự án
chạy trên cùng một dsh profile. Nếu nhân bản sang dự án khác, chỉ copy phần báo cáo này.

## 0. SNAPSHOT

```text
Thời điểm kiểm chứng : 2026-09-25 (lần 2)
dsh core            : 0.1.7-rc.2 (cordis 4.0.4)
pi-ai catalog       : @earendil-works/pi-ai
Nguồn giá           : OpenRouter /api/v1/models (pricing), opencode.ai/zen*/v1, api.commandcode.ai
Kết quả             : 24 model free; 20/24 hỗ trợ tools; discovery máy chạy bằng
                      node tools/discover-free-models.mjs (repo dsh-ai-router)
```

**Repo plugin:** `D:\13. Duong Trong Thang\Tai lieu\dsh-ai-router` — chứa registry,
generator, discovery và test. Không thuộc repo ERP.

> **Đây là ảnh chụp tại một thời điểm.** Theo §10, free model có thể biến mất, bị rate limit,
> hết quota hoặc bị tạm vô hiệu. Phải re-check lúc runtime, không được tin đọc một lần rồi dùng mãi.
>
> Trong lúc khảo sát, 2/12 model OpenRouter trả 429 và có model từng OK ở lần trước lại 429.
> Đó là bằng chứng trực tiếp cho tiền đề "FREE ≠ UNLIMITED".

## 1. KÝ HIỆU MỨC ĐỘ KIỂM CHỨNG

Không được ghi thông tin chưa kiểm chứng (§11). Vì vậy mỗi ô được gắn nhãn:

| Nhãn | Ý nghĩa |
|---|---|
| `LIVE` | Đã gọi API thật, nhận phản hồi thành công |
| `DECL` | Provider khai báo trong metadata, chưa gọi thật từng lần |
| `FAIL` | Đã thử, đã thất bại — ghi rõ mã lỗi |

## 2. BẢNG CHÍNH — ỨNG VIÊN ĐANG SỐNG (OpenRouter)

Tất cả model dưới đây có `pricing.prompt = 0` và `pricing.completion = 0` (FREE thật, đã đọc từ
OpenRouter pricing API, không phải suy đoán).

| Provider | Model | Model ID | Free/Paid | Input Cost | Output Cost | Context | Reasoning | Tool Calling | Capabilities | Current Availability | Fallback Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| openrouter → Stealth | Space Bunny Alpha | `stealth/space-bunny-alpha` | FREE | $0 | $0 | 1,000,000 | Y `DECL` | Y `LIVE` | reasoning, vision (text+image+video), ctx lớn nhất | OK `LIVE` | 1 |
| openrouter → Novita | Ling 3.0 Flash Fin | `inclusionai/ling-3.0-flash-fin:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | Y `LIVE` | audit, code review, output có cấu trúc (severity) | OK `LIVE` | 2 |
| openrouter → Cohere | North Mini Code | `cohere/north-mini-code:free` | FREE | $0 | $0 | 256,000 | Y `DECL` | Y `LIVE` | code audit, test, lint — chuyên code, JSON sạch | OK `LIVE` | 3 |
| openrouter → Nvidia | Nemotron 3 Ultra 550B | `nvidia/nemotron-3-ultra-550b-a55b:free` | FREE | $0 | $0 | 1,000,000 | Y `DECL` | Y `LIVE` | debug, phân tích repo lớn, reasoning nặng | OK `LIVE` | 4 |
| openrouter → Nvidia | Nemotron 3 Super 120B | `nvidia/nemotron-3-super-120b-a12b:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | Y `LIVE` | test, validation, research | OK `LIVE` | 5 |
| openrouter → AtlasCloud | Dots3 Note Preview | `dots-studio/dots-3-note-preview:free` | FREE | $0 | $0 | 512,000 | Y `DECL` | Y `LIVE` | documentation (có image), báo cáo .md | OK `LIVE` | 6 |
| openrouter → Google | Gemma 4 31B IT | `google/gemma-4-31b-it:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | Y `DECL` | research, vision (text+image+video) | OK `LIVE` | 7 |
| openrouter → Novita | Ling 3.0 Flash Sante | `inclusionai/ling-3.0-flash-sante:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | Y `DECL` | audit, format, checklist — nhẹ | OK `LIVE` | 8 |
| openrouter → Nvidia | Nemotron 3.5 Lightning | `nvidia/nemotron-3.5-lightning:free` | FREE | $0 | $0 | 1,000,000 | Y `DECL` | Y `DECL` | research dài; **LƯU Ý: đổ suy luận ra content** | OK `LIVE` | 9 |
| openrouter → LiquidAI | LFM2.5 2.6B | `liquid/lfm-2.5-2.6b:free` | FREE | $0 | $0 | 65,536 | Y `DECL` | Y `DECL` | task nhỏ, notification, todo update — nhanh | OK `LIVE` | 10 |
| openrouter → Nexa | Nex N2.5 Pro | `nex-agi/nex-n2.5-pro:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | **Y `LIVE`** | debug dự phòng, lint — tool-calling đúng chuẩn | OK `LIVE` | 11 |
| openrouter → Nexa | Nex N2.5 Mini | `nex-agi/nex-n2.5-mini:free` | FREE | $0 | $0 | 262,144 | Y `DECL` | **Y `LIVE`** | task nhỏ-trung, dự phòng nhanh | OK `LIVE` | 12 |
| openrouter → Nvidia | Nemotron 3 Nano Omni | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | FREE | $0 | $0 | 256,000 | Y `DECL` | **Y `LIVE`** | **vision worker** — nhận text + image + audio | OK `LIVE` | 13 |

**Điểm quan trọng:** 10 model trên đến từ **6 upstream provider khác nhau** (Stealth, Novita,
Cohere, Nvidia, AtlasCloud, Google). Nghĩa là chúng **không sập cùng nhau** khi một upstream chết —
đây là cơ sở để đặt thứ tự fallback như trên.

Ràng buộc chung: tất cả đi qua **hạn mức free dùng chung của OpenRouter**. Đó là điểm yếu
duy nhất của nhóm này.

## 3. ỨNG VIÊN CÓ GIÁ = 0 NHƯNG ĐANG KHÔNG SỐNG

| Provider | Model ID | Context | Lỗi | Ghi chú |
|---|---|---|---|---|
| openrouter → Qwen | `qwen/qwen3.8-27b:free` | 262,144 | **429** `FAIL` | rate limit upstream |
| openrouter → Poolside | `poolside/laguna-s-2.1:free` | 262,144 | **429** `FAIL` | rate limit upstream |

Không xoá khỏi registry — giữ làm candidate, chỉ đánh dấu `RATE_LIMITED`, đúng §5.

## 4. PROVIDER KHÁC — CÙNG CHỈ ĐỊNH MODEL FREE

Đây là nguồn **quan trọng nhất** vì OpenRouter không ổn định.

### Command Goat (`https://api.commandcode.ai/provider/v1`)

| Model ID | Free/Paid | Context | Tool Calling | Availability | Nhận xét |
|---|---|---|---|---|---|
| `inclusionai/ling-3.0-flash-sante:free` | FREE | 262,144 | chưa test `DECL` | **OK `LIVE`** | Hạn mức **riêng của Goat**, không dùng chung OpenRouter → ưu tiên cao |
| `poolside/laguna-s-2.1-free` | FREE | 262,144 | chưa test `DECL` | **429 `FAIL`** | có lúc OK, có lúc 429 |
| `meituan/LongCat-2.0:free` | FREE | — | — | **403 `FAIL`** | không dùng được với key hiện tại |

Ưu điểm Goat: quota **không chia sẻ** với OpenRouter → dùng làm failover thật sự cho nhóm OpenRouter.

### OpenCode Zen (`https://opencode.ai/zen`, API `anthropic-messages`)

| Model ID | Free/Paid | Availability | Nhận xét |
|---|---|---|---|
| `space-bunny-free` | FREE | **200 `LIVE`** | Trả lời đúng; **có thinking block thật** (19/20 output token) → reasoning hoạt động |
| `big-pickle` | — | **403 `FAIL`** | Các model khác của zen cũng 403 → cần account OAuth, không nhận API key |

### OpenCode Go (`https://opencode.ai/zen/go`, API `anthropic-messages`)

| Model ID | Availability | Chi tiết |
|---|---|---|
| `space-bunny-free` | **429 `FAIL`** | `Retry-After: 1267607` giây ≈ **14,7 ngày** |
| `glm-5.3-flash` | **429 `FAIL`** | cùng hạn mức |

**Toàn bộ provider OpenCode Go đang hết hạn mức.** Không dùng làm worker lúc này.
Lưu ý: endpoint `/v1/models` **vẫn trả 200** (42 model cho go, 80 cho zen) → dùng để discovery
không tốn inference, nhưng **không được suy ra là model gọi được**.

### Cline (`https://api.cline.bot/api/v1`)

| Model ID | Availability | Chi tiết |
|---|---|---|
| `z-ai/glm-5.2:free` | **500 (bọc 429) `FAIL`** | Lỗi gốc: `failed to invoke ... from Openrouter: 429` |
| `z-ai/glm-5.3-flash` | **200 `LIVE`** | Trả lời đúng. **CÓ PHÍ** — $0.15/M in, $0.50/M out |
| `z-ai/glm-5.2` | **200 `LIVE`** | **CÓ PHÍ** — $0.65/M in, $2.04/M out |

**Kết luận Cline: KHÔNG phải free tier riêng.** Nó là proxy của OpenRouter, dùng chung hạn mức
free. Plugin khai `cost: {input: 0, output: 0}` cho **mọi** model
(`@jiesou/dsh-cline-free-provider/lib/index.js:153`) — con số 0 đó là **giả định của plugin**,
không phải giá thật. Giá thật lấy từ OpenRouter pricing API như bảng trên.

**Sửa cần thiết cho tài liệu gốc:** mục `mutil AI.md` §9 và PATCH §2 liệt kê
"GLM 5.3 Flash FREE / GLM 5.2 FREE" làm worker. Kiểm chứng cho thấy:
- `z-ai/glm-5.3-flash:free` **không tồn tại** trên OpenRouter
- `z-ai/glm-5.2:free` có thật, giá = 0, nhưng đang 429 và chỉ có context **32,768** (bản trả phí là 1,048,576)

## 5. MODEL ĐÃ LOẠI KHỎI DANH SÁCH WORKER

| Model ID | Lý do loại (đã kiểm chứng) |
|---|---|
| `thinkingmachines/inkling:free` | 403 — `only available on agentic harnesses` |
| `nex-agi/nex-n2.5-pro:free` | 500 |
| `minimax/minimax-m3:free` | 404 — model id không tồn tại trên OpenRouter |
| `nvidia/nemotron-3-ultra-550b-a55b:free` (về mặt hành vi) | Không loại, nhưng **hạn chất lượng**: đổ cả chuỗi suy luận ra `content`, `finish_reason: length`, không theo format yêu cầu → tốn token, vô dụng cho task cần JSON/cấu trúc. Giữ làm dự phòng cho task reasoning tự do. |

## 6. NHẬN XÉT VỀ REASONING

| Model | Quan sát thực tế |
|---|---|
| `space-bunny-free` | Trả **thinking block + text block** riêng biệt → tốn **19/20 output token** cho câu hỏi 17×23 |
| `nvidia/nemotron-3.5-lightning:free` | Suy luận **bị trộn vào content** dạng văn bản |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | Suy luận **bị trộn vào content**, không theo format |
| `cohere/north-mini-code:free` | Trả **JSON sạch** đúng yêu cầu, phát hiện đúng SQL injection |
| `inclusionai/ling-3.0-flash-fin:free` | Trả **JSON có cấu trúc** kèm `severity` |

**Cảnh báo về §9 / PATCH §9 (MAX REASONING):** yêu cầu `reasoning = MAX` cho mọi model **mâu thuẫn
với mục tiêu tối ưu chi phí ở §1**. Đo thật: `space-bunny-free` dùng 19/20 token cho một phép nhân.
Nên đặt master ở mức cao, worker ở mức thấp hoặc để mặc định của model. Với worker dạng
`cohere/north-mini-code:free`, suy luận tốn token mà **không cải thiện** chất lượng output.

## 7. ĐỀ XUẤT WORKER REGISTRY (theo §3, §13)

Ưu tiên theo **upstream độc lập + availability thật**, không theo tên model:

```yaml
workers:
  audit:
    candidates:
      - cohere/north-mini-code:free        # code audit, JSON sạch
      - inclusionai/ling-3.0-flash-fin:free
      - inclusionai/ling-3.0-flash-sante:free   # Goat — quota riêng

  testing:
    candidates:
      - cohere/north-mini-code:free
      - nvidia/nemotron-3-super-120b-a12b:free

  documentation:
    candidates:
      - stealth/space-bunny-alpha               # ctx 1M, image+video
      - dots-studio/dots-3-note-preview:free    # ctx 512K, image
      - google/gemma-4-31b-it:free              # vision

  debugging:
    candidates:
      - nvidia/nemotron-3-ultra-550b-a55b:free
      - stealth/space-bunny-alpha

  notification:
    candidates:
      - liquid/lfm-2.5-2.6b:free                # nhỏ, nhanh
      - nvidia/nemotron-3-super-120b-a12b:free

  research:
    candidates:
      - stealth/space-bunny-alpha               # ctx 1M
      - nvidia/nemotron-3.5-lightning:free      # ctx 1M (cảnh báo: ồn)
      - google/gemma-4-31b-it:free
```

Mỗi capability có **≥3 candidate** và tối thiểu **2 upstream khác nhau** → đáp ứng §6 worker failover
(A → B → C → BLOCK).

## 8. MASTERY — CHUỖI PROVIDER HIỆN TẠI (§3, §8)

| Priority | Provider | Model ID | Availability | Ghi chú |
|---|---|---|---|---|
| 1 | Command Goat | `deepseek/deepseek-v4.1-flash` | **200 `LIVE`** | **Đã hết rate limit (2026-09-25). Đủ điều kiện revert master** |
| 2 | Command Goat | `deepseek/deepseek-v4-flash` | chưa thử lại | cùng hạn mức, dự phòng gần |
| 3 | OpenCode Go | `deepseek-v4.1-flash` | **429 `FAIL`** | `Go usage limit exceeded` — hết hạn mức coding plan |
| 4 | OpenRouter | `stealth/space-bunny-alpha` | **200 `LIVE`** | free, 1M ctx — master tạm thời khi Goat chết |

**Chuỗi failover hiện 2/4 sống** (Goat chính + Space Bunny free). Rủi ro lớn nhất
đã giảm: master luôn có ít nhất một đường dùng được quota miễn phí.

**Hành động đã làm (2026-09-25):** master trong `cordis.patch.yml` vẫn là Space Bunny
với ghi chú điều kiện revert. Điều kiện **đã đạt** — Goat trả 200. Cần đổi
`provider: command-code` + `model: deepseek/deepseek-v4.1-flash` trong entry
`agent-default-model` khi bạn rảnh (sửa file này sẽ kích hoạt hot-reload, nên
làm khi không có turn nào đang chạy).

Cline không nằm trong chuỗi nữa: nó **là proxy OpenRouter**, dùng chung hạn mức free,
nên không thêm độ dự phòng độc lập nào.

Khuyến nghị: chờ Goat hết rate limit, hoặc bổ sung provider dự phòng. `deepseek/deepseek-v4-flash`
trên Goat có thể là lựa chọn thay vì Cline vì không phụ thuộc OpenRouter.

## 9. GIAO THỨC RE-CHECK (theo §10)

```text
Khi nào            : trước mỗi lần sinh Worker Registry, và định kỳ khi chạy
Nguồn model list  : OpenRouter /api/v1/models (không tốn inference)
                   https://opencode.ai/zen/go/v1/models (trả 200 kể cả khi đang 429 — KHÔNG suy ra là gọi được)
Phải gọi thật     : 1 request tối thiểu / model trước khi đưa vào registry
Không tin          : tên model có chữ "free"
                    cost = 0 trong metadata của plugin (Cline đã bịa số này)
                    kết quả kiểm tra cũ hơn 30 phút
```

## 10. CÁC MẪU THỨC ĐÃ SỬA SO VỚI KẾ HOẠCH GỐC

| Vị trí | Nội dung gốc | Thực tế kiểm chứng | Hành động |
|---|---|---|---|
| §9 (thân bài) | Worker = GLM 5.3 Flash / GLM 5.2 / Space Bunny | `glm-5.3-flash:free` không tồn tại; `glm-5.2:free` 429 + ctx chỉ 32K | Đã bị PATCH §1-§3 thay thế — nên xoá §9 cũ để tránh mâu thuẫn |
| PATCH §2 | "Ưu tiên OpenCode free models" + liệt kê Big Pickle, MiMo Free, Nemotron Free... | zen 403, opencode-go 429. **Toàn bộ ví dụ nằm trong PATCH đều không gọi được** | Đổi thành: ưu tiên theo **availability thật**, không theo hãng |
| PATCH §9 | `reasoning = MAX` cho mọi model | Mâu thuẫn mục tiêu tối ưu chi phí §1; và nhiều model trộn suy luận vào content | Đặt master = high, worker = mặc định model |
| §3.3 / §8 | Cline = fallback free | Cline **là proxy OpenRouter**, có model trả phí | Ghi rõ Cline không phải free tier riêng |

## 11. TÍNH HỢP LỆ DỮ LIỆU

```text
Model ID            : lấy từ API chính thức, không tự bịa
Pricing             : OpenRouter pricing API, không tin metadata plugin
Context             : OpenRouter context_length
Tool Calling        : LIVE cho 5 model; DECL (supported_parameters) cho 7 model còn lại
Reasoning           : DECL cho tất cả; quan sát thực tế cho 5 model ở §6
Availability        : đo bằng HTTP call thật, ghi rõ mã lỗi
API key             : KHÔNG ghi vào tài liệu này — nằm trong ~/.dsh/.credentials.yaml
```

Không có API key, token hay secret nào trong file này.
