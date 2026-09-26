# MASTER TASK — TRIỂN KHAI MULTI-AI MODEL ORCHESTRATION CHO DSH / OPENCODE

## 1. MỤC TIÊU

Tôi muốn xây dựng một môi trường **Multi-AI Coding Agent** trên máy đang chạy DSH / OpenCode Desktop.

DSH sẽ được sử dụng làm môi trường coding chính cho nhiều dự án khác nhau.

Mục tiêu của hệ thống:

```text
                    USER
                     │
                     ▼
              DSH / OPENCODE
                     │
                     ▼
             MASTER AI ROUTER
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   MASTER MODEL              WORKER MODELS
        │                         │
        │                  ┌──────┼──────┐
        │                  │      │      │
        ▼                  ▼      ▼      ▼
   DeepSeek V4.1 Flash    GLM    GLM   Bunny
                          5.3    5.2    Space
```

MASTER AI sẽ đảm nhiệm công việc reasoning, architecture, planning và coding chính.

WORKER AI đảm nhiệm các task phụ trợ, có thể chạy song song/background khi phù hợp.

---

# 2. MASTER MODEL

MASTER model ưu tiên:

```text
DeepSeek V4.1 Flash
```

MASTER có **2 provider chính**:

```text
Provider 1:
Command Goat

Provider 2:
OpenCode Go
```

Hai provider này cùng cung cấp DeepSeek V4.1 Flash.

Mục tiêu là xây dựng cơ chế **automatic provider failover**.

---

# 3. MASTER PROVIDER FAILOVER

Phải triển khai logic:

```text
                DeepSeek V4.1 Flash
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        Command Goat          OpenCode Go
              │                   │
              └─────────┬─────────┘
                        │
                    PROVIDER
                    HEALTH CHECK
```

Priority:

```text
1. Command Goat
2. OpenCode Go
3. Cline — DeepSeek V4 Flash FREE
```

## 3.1. Khi Command Goat lỗi

Tự động chuyển:

```text
Command Goat
      ↓
OpenCode Go
```

Không yêu cầu user phải đổi model thủ công.

---

## 3.2. Khi Command Goat hết quota

Nếu phát hiện provider đã:

* hết quota;
* vượt usage limit;
* rate limit kéo dài;
* provider không thể gọi model;
* authentication/provider error;

thì đánh dấu provider đó là:

```text
UNAVAILABLE
```

và chuyển sang:

```text
OpenCode Go
```

---

## 3.3. Khi OpenCode Go lỗi hoặc hết quota

Nếu OpenCode Go không thể sử dụng:

```text
Command Goat
      ↓
OpenCode Go
      ↓
Cline
```

Cline sử dụng:

```text
DeepSeek V4 Flash FREE
```

làm fallback.

---

# 4. KHÔNG ĐƯỢC NHẦM MODEL

Phải phân biệt rõ:

```text
DeepSeek V4.1 Flash
```

và:

```text
DeepSeek V4 Flash
```

MASTER ưu tiên là:

```text
DeepSeek V4.1 Flash
```

Cline DeepSeek V4 Flash FREE chỉ là:

```text
FALLBACK
```

không phải MASTER provider chính.

---

# 5. PROVIDER HEALTH STATE

Cần xây dựng hoặc tận dụng cơ chế provider state nếu OpenCode hỗ trợ.

Mỗi provider nên có trạng thái:

```text
AVAILABLE
DEGRADED
RATE_LIMITED
QUOTA_EXCEEDED
AUTH_ERROR
NETWORK_ERROR
MODEL_UNAVAILABLE
DISABLED
```

Ví dụ:

```text
Command Goat
    STATUS = QUOTA_EXCEEDED
    ↓
temporarily disabled
    ↓
OpenCode Go
    STATUS = AVAILABLE
    ↓
continue
```

Không retry vô hạn provider đang lỗi.

---

# 6. AUTOMATIC RECOVERY

Nếu provider lỗi tạm thời:

```text
FAILED
 ↓
BACKOFF
 ↓
RETRY HEALTH CHECK
 ↓
AVAILABLE
```

Khi provider phục hồi, không nhất thiết phải chuyển MASTER về ngay lập tức nếu session hiện tại đang chạy ổn định.

Ưu tiên:

```text
CURRENT SESSION STABILITY
```

Không được liên tục switch model giữa một task đang chạy nếu không cần thiết.

---

# 7. QUOTA / FAILURE DETECTION

Hệ thống cần phân biệt tối thiểu:

```text
NETWORK ERROR
AUTH ERROR
RATE LIMIT
QUOTA EXCEEDED
MODEL ERROR
PROVIDER ERROR
```

Không được coi mọi lỗi API là hết quota.

Nếu không thể xác định chính xác nguyên nhân:

```text
UNKNOWN PROVIDER ERROR
```

và thực hiện fallback an toàn.

---

# 8. TELEGRAM ALERT

Tôi đang sử dụng Telegram để theo dõi DSH.

Khi provider MASTER có vấn đề, phải gửi notification.

Ví dụ:

```text
[AI ROUTER ALERT]

Provider: Command Goat
Model: DeepSeek V4.1 Flash
Status: QUOTA_EXCEEDED

Action:
Automatically switched to OpenCode Go.

Current provider:
OpenCode Go
```

---

## 8.1. Khi cả MASTER provider đều lỗi

Thông báo:

```text
[AI ROUTER CRITICAL]

DeepSeek V4.1 Flash unavailable.

Command Goat: FAILED
OpenCode Go: FAILED

Fallback:
Cline / DeepSeek V4 Flash FREE

Action required:
Please check provider status/quota.
```

---

# 9. WORKER MODELS

Các worker ban đầu:

```text
1. GLM 5.3 Flash FREE
2. GLM 5.2 FREE
3. Space Bunny
```

Worker không phải MASTER.

Worker được sử dụng cho các task phụ trợ như:

```text
AUDIT
TEST
DEBUG
FORMAT
LINT
DOCUMENTATION
CODE REVIEW
RESEARCH
NOTIFICATION
VALIDATION
```

---

# 10. WORKER ROUTING

Không hard-code một worker cố định cho mọi loại task.

Thiết kế worker theo capability.

Ví dụ:

```text
AUDIT
 ├── GLM 5.3 Flash
 ├── GLM 5.2
 └── Space Bunny

TEST
 ├── GLM 5.3 Flash
 └── GLM 5.2

DOCUMENTATION
 ├── Space Bunny
 └── GLM 5.2

DEBUG
 ├── GLM 5.3 Flash
 └── GLM 5.2
```

Router phải có khả năng chọn worker phù hợp.

---

# 11. WORKER FALLBACK

Worker phải có fallback.

Ví dụ:

```text
Space Bunny
     ↓
UNAVAILABLE
     ↓
GLM 5.3 Flash
     ↓
UNAVAILABLE
     ↓
GLM 5.2
```

Nếu một worker:

* hết quota;
* hết free usage;
* provider lỗi;
* model unavailable;
* authentication lỗi;
* rate limit;

thì worker đó phải được đánh dấu unavailable và task được chuyển sang worker khác phù hợp.

---

# 12. WORKER DYNAMIC CONFIGURATION

Đây là yêu cầu rất quan trọng.

Tôi muốn có khả năng thay worker model mà **không phải sửa architecture của hệ thống**.

Ví dụ hiện tại:

```text
worker:
    Space Bunny
```

Nếu Space Bunny hết free quota:

```text
Space Bunny
     ↓
UNAVAILABLE
     ↓
Telegram notification
```

Telegram phải thông báo:

```text
[WORKER ALERT]

Worker:
Space Bunny

Status:
FREE QUOTA EXHAUSTED

Affected capabilities:
Documentation / Audit / ...

Action required:
Please replace worker model.
```

Tôi có thể sau đó thay:

```text
Space Bunny
```

bằng:

```text
New Worker Model
```

mà không phải sửa MASTER architecture.

---

# 13. WORKER REGISTRY

Tạo một registry/configuration cho worker.

Ví dụ concept:

```yaml
workers:

  audit:
    providers:
      - glm-5.3-flash
      - glm-5.2
      - space-bunny

  testing:
    providers:
      - glm-5.3-flash
      - glm-5.2

  documentation:
    providers:
      - space-bunny
      - glm-5.2

  debugging:
    providers:
      - glm-5.3-flash
      - glm-5.2
```

Không nhất thiết phải dùng YAML nếu OpenCode hiện tại có cơ chế configuration tốt hơn.

Hãy sử dụng cơ chế native/phù hợp nhất với OpenCode version hiện tại.

---

# 14. MODEL ABSTRACTION

Không hard-code model/provider trực tiếp vào business logic.

Tách:

```text
MODEL
PROVIDER
CAPABILITY
ROLE
PRIORITY
HEALTH
QUOTA
```

Ví dụ:

```text
Worker:
    ID = worker-debugger

Capability:
    DEBUG

Primary:
    GLM 5.3 Flash

Fallback:
    GLM 5.2

Status:
    AVAILABLE
```

Sau này có thể thay model mà không cần sửa task system.

---

# 15. MAXIMUM REASONING

Tất cả model phải sử dụng mức reasoning cao nhất mà provider/model thực tế hỗ trợ.

Yêu cầu:

```text
reasoning = MAX
```

hoặc option tương đương của provider/model.

Nhưng:

**KHÔNG được tự bịa parameter.**

Trước tiên phải kiểm tra:

* OpenCode version;
* provider API;
* model capabilities;
* reasoning parameter;
* thinking/reasoning configuration.

Nếu model không hỗ trợ reasoning control thì phải ghi rõ:

```text
MODEL DOES NOT EXPOSE REASONING CONFIGURATION
```

Không được giả lập hoặc thêm parameter không được provider hỗ trợ.

---

# 16. MASTER / WORKER COMMUNICATION

MASTER và WORKER cần trao đổi thông qua state/report.

Ưu tiên filesystem/Markdown nếu OpenCode hỗ trợ tốt.

Kiến trúc:

```text
MASTER
  │
  ├── CREATE TASK
  │
  ▼
TASK FILE
  │
  ▼
WORKER
  │
  ├── EXECUTE
  │
  ├── TEST
  │
  └── REPORT
        │
        ▼
WORKER REPORT
        │
        ▼
MASTER
        │
        ├── ACCEPT
        ├── RETRY
        └── REASSIGN
```

---

# 17. TASK FILE

Mỗi worker task phải có ID.

Ví dụ:

```text
TASK-000001
```

Task phải chứa:

```text
TASK ID
ROLE
CAPABILITY
MODEL
PROVIDER
PRIORITY
INPUT
REQUIREMENT
EXPECTED OUTPUT
FILES IN SCOPE
CONSTRAINTS
STATUS
```

---

# 18. WORKER REPORT

Worker phải ghi:

```text
TASK ID
WORKER
MODEL
PROVIDER
STATUS
WORK DONE
FILES INSPECTED
FILES CHANGED
TEST RESULT
ERROR
RECOMMENDATION
NEXT ACTION
```

MASTER đọc report trước khi xác nhận task.

---

# 19. PARALLEL WORKER

Nếu task độc lập:

```text
MASTER
 │
 ├── AUDIT → Worker A
 │
 ├── TEST → Worker B
 │
 └── DOCUMENT → Worker C
```

có thể chạy song song.

MASTER không cần chờ từng worker nếu không có dependency.

Nếu task có dependency:

```text
TASK A
 ↓
TASK B
 ↓
TASK C
```

phải chạy tuần tự.

---

# 20. FILE OWNERSHIP

Phải tránh:

```text
MASTER đang sửa file
        +
WORKER sửa cùng file
        =
CONFLICT
```

Cần có cơ chế:

```text
LOCK
OWNERSHIP
TASK SCOPE
```

Nếu worker chỉ audit/test thì không được sửa source.

Nếu worker được phép sửa:

```text
CHECK LOCK
→ MODIFY
→ TEST
→ REPORT
→ RELEASE
```

---

# 21. WORKER PERMISSION

Phân quyền worker theo role.

### AUDIT

```text
READ = YES
WRITE = NO
```

### TEST

```text
READ = YES
EXECUTE TEST = YES
WRITE SOURCE = NO
```

### FORMAT

```text
READ = YES
WRITE = YES
BUSINESS LOGIC CHANGE = NO
```

### DEBUG

```text
READ = YES
WRITE = YES
TEST = YES
```

### DOCUMENTATION

```text
READ = YES
WRITE DOCUMENTATION = YES
SOURCE CODE = NO
```

---

# 22. PLUGIN / EXTENSION DISCOVERY

Trước khi cài plugin:

1. Kiểm tra OpenCode version.
2. Kiểm tra plugin/extension hiện có.
3. Kiểm tra capability native.
4. Chỉ cài plugin nếu thực sự cần.

Các nhóm capability cần kiểm tra:

```text
Provider / Model integration
Agent / Subagent
Background execution
Task orchestration
Hooks
Notifications
Telegram
Filesystem state
Logging
Health check
Retry / fallback
```

Không cài plugin trùng chức năng.

Không cài plugin không tương thích với version hiện tại.

---

# 23. MODEL DISCOVERY

Kiểm tra chính xác model ID của:

```text
DeepSeek V4.1 Flash
GLM 5.3 Flash FREE
GLM 5.2 FREE
Space Bunny
DeepSeek V4 Flash FREE / Cline
```

Nếu provider dùng model ID khác với display name:

```text
DISPLAY NAME
≠
MODEL ID
```

phải lưu đúng model ID thực tế.

Không được tự đoán model ID.

Nếu model không tồn tại/không available:

```text
DO NOT FAKE CONFIGURATION
```

ghi rõ:

```text
MODEL NOT AVAILABLE
```

và tiếp tục thiết kế fallback architecture.

---

# 24. CREDENTIAL / API KEY

Không hard-code API key vào repository.

Không ghi API key vào Markdown report.

Không gửi API key qua Telegram.

Kiểm tra cách OpenCode hiện tại quản lý:

```text
API KEY
AUTH
ENVIRONMENT VARIABLE
SECRET STORE
PROVIDER LOGIN
```

và sử dụng cơ chế an toàn hiện có.

---

# 25. DSH COMPATIBILITY

Đây là hệ thống sẽ được sử dụng lâu dài cho nhiều dự án.

Do đó:

```text
PROJECT A
PROJECT B
PROJECT C
...
```

đều phải có thể sử dụng cùng orchestration layer.

Không hard-code:

```text
VNTECH ERP
```

vào Multi-AI core.

Multi-AI layer phải là infrastructure dùng chung.

---

# 26. OBSERVABILITY

Cần có log để biết:

```text
CURRENT MASTER MODEL
CURRENT PROVIDER
CURRENT WORKER
TASK ID
PROVIDER SWITCH
FAILOVER REASON
WORKER FAILURE
QUOTA EVENT
TASK RESULT
```

Ví dụ:

```text
[ROUTER]

Task:
TASK-000125

Primary:
Command Goat / DeepSeek V4.1 Flash

Status:
QUOTA_EXCEEDED

Failover:
OpenCode Go / DeepSeek V4.1 Flash

Result:
SUCCESS
```

---

# 27. TELEGRAM EVENTS

Không spam Telegram cho từng dòng log.

Chỉ gửi các event quan trọng:

```text
MASTER START
MASTER PROVIDER SWITCH
MASTER PROVIDER FAILURE
MASTER FALLBACK
WORKER FAILURE
WORKER QUOTA EXHAUSTED
WORKER REPLACEMENT REQUIRED
TASK BLOCKED
PHASE COMPLETE
CRITICAL ERROR
```

---

# 28. KHÔNG COMMIT / PUSH

Trong toàn bộ quá trình setup:

```text
DO NOT COMMIT
DO NOT PUSH
```

Chỉ khi tôi yêu cầu mới commit/push.

---

# 29. EXECUTION WORKFLOW

Bắt buộc thực hiện theo:

```text
PHASE 0
DISCOVERY
    ↓
PHASE 1
PROVIDER CONFIGURATION
    ↓
PHASE 2
MASTER FAILOVER
    ↓
PHASE 3
WORKER CONFIGURATION
    ↓
PHASE 4
WORKER ROUTING
    ↓
PHASE 5
TASK / REPORT SYSTEM
    ↓
PHASE 6
TELEGRAM
    ↓
PHASE 7
HEALTH CHECK
    ↓
PHASE 8
END-TO-END TEST
```

---

# 30. PHASE 0 — BẮT ĐẦU NGAY

Không được cài đặt ngay.

Trước tiên inspect:

```text
OpenCode version
DSH configuration
Provider configuration
Model configuration
Existing agents
Existing plugins
Existing commands
Existing hooks
Existing MCP/tools
Existing Telegram integration
Existing task system
Existing background execution
OS
Environment variables
Repository structure
```

Sau đó tạo:

```text
MULTI_AI_DISCOVERY.md
```

ghi:

```text
CURRENT ENVIRONMENT
AVAILABLE PROVIDERS
AVAILABLE MODELS
AVAILABLE PLUGINS
AVAILABLE AGENTS
CURRENT TELEGRAM
CURRENT LIMITATIONS
RECOMMENDED ARCHITECTURE
MISSING COMPONENTS
```

---

# 31. SAU DISCOVERY

Sau khi discovery:

1. Tạo TODO.
2. Xác định dependency.
3. Cài/configure từng component.
4. Test từng component.
5. Không cài tất cả một lần.
6. Sau mỗi component phải validate.
7. Ghi lại configuration.
8. Tiếp tục component tiếp theo.

Nếu component không cần thiết thì không cài.

---

# 32. CONTINUOUS EXECUTION

Không được dừng chỉ vì:

```text
TODO EMPTY
```

TODO chỉ là queue hiện tại.

Sau mỗi task:

```text
DONE
 ↓
UPDATE STATE
 ↓
UPDATE TODO
 ↓
SELECT NEXT TASK
 ↓
CONTINUE
```

Nếu có thể tiếp tục thì không hỏi user.

Chỉ dừng khi:

```text
USER DECISION REQUIRED
```

hoặc:

```text
CRITICAL TECHNICAL BLOCKER
```

---

# 33. TODO PHẢI LUÔN ĐƯỢC HIỂN THỊ

Mỗi khi:

```text
START TASK
END TASK
START PHASE
END PHASE
PROVIDER SWITCH
WORKER SWITCH
```

phải cập nhật TODO.

Trạng thái tối thiểu:

```text
DONE
IN PROGRESS
NEXT
BLOCKED
```

---

# 34. BÁO CÁO TELEGRAM

Sau khi hoàn thành từng phase phải gửi Telegram.

Format:

```text
[MULTI-AI SETUP]

Phase:
PHASE X

Status:
COMPLETED

Completed:
- ...

Current:
- ...

Next:
- ...

Issues:
- ...
```

Provider failover và worker quota cũng phải gửi Telegram ngay khi xảy ra.

---

# 35. ACCEPTANCE TEST

Cuối cùng phải test tối thiểu:

## TEST 1

```text
Command Goat
DeepSeek V4.1 Flash
```

hoạt động.

## TEST 2

Giả lập/provider failure:

```text
Command Goat FAIL
```

Expected:

```text
OpenCode Go
```

## TEST 3

```text
Command Goat FAIL
OpenCode Go FAIL
```

Expected:

```text
Cline
DeepSeek V4 Flash FREE
```

## TEST 4

Worker:

```text
Space Bunny FAIL
```

Expected:

```text
Worker fallback
```

và:

```text
Telegram ALERT
```

## TEST 5

Worker task:

```text
MASTER
 ↓
CREATE TASK
 ↓
WORKER
 ↓
REPORT
 ↓
MASTER REVIEW
```

## TEST 6

Parallel:

```text
AUDIT
TEST
DOCUMENTATION
```

chạy đồng thời nếu môi trường hỗ trợ.

## TEST 7

Restart DSH/OpenCode.

Expected:

```text
STATE PRESERVED
TASK STATE PRESERVED
MASTER CAN RECOVER
```

---

# 36. KẾT QUẢ CUỐI CÙNG CẦN ĐẠT

Môi trường sau khi hoàn thành phải có architecture tương đương:

```text
                    DSH / OPENCODE
                           │
                           ▼
                    MASTER ROUTER
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      DeepSeek V4.1 Flash              WORKERS
             │                           │
       ┌─────┴─────┐             ┌──────┼──────┐
       │           │             │      │      │
       ▼           ▼             ▼      ▼      ▼
 Command Goat  OpenCode Go      GLM    GLM    Bunny
       │           │           5.3    5.2    Space
       └─────┬─────┘
             │
             ▼
        Cline fallback
        DeepSeek V4 Flash
             │
             ▼
       Telegram alerts
```

MASTER:

```text
PLANNING
ARCHITECTURE
CODING
ORCHESTRATION
REVIEW
INTEGRATION
```

WORKERS:

```text
AUDIT
TEST
DEBUG
FORMAT
DOCUMENT
NOTIFICATION
```

Router:

```text
HEALTH CHECK
QUOTA DETECTION
FAILOVER
RETRY
WORKER FALLBACK
MODEL SWITCH
```

State:

```text
TASK
REPORT
CHECKPOINT
LOG
LOCK
```

Notification:

```text
TELEGRAM
```

---

# 37. QUY TẮC CUỐI CÙNG

Không được:

```text
ASSUME
→ CONFIGURE
```

Mà phải:

```text
INSPECT
→ VERIFY
→ PLAN
→ CONFIGURE
→ TEST
→ DOCUMENT
→ CONTINUE
```

Không được tự ý:

```text
COMMIT
PUSH
DELETE
OVERWRITE
INSTALL DUPLICATE PLUGIN
```

Không được tự bịa:

```text
MODEL ID
PLUGIN NAME
PROVIDER API
REASONING PARAMETER
TELEGRAM API
```

Nếu không xác định được:

```text
REPORT THE LIMITATION
```

và đề xuất phương án tương thích.

---

# 38. BẮT ĐẦU

**Bắt đầu ngay bằng PHASE 0 — DISCOVERY.**

Không cài đặt trước khi kiểm tra môi trường hiện tại.

Sau discovery, nếu đủ thông tin thì tự động tiếp tục PHASE 1.

Trong toàn bộ quá trình:

```text
CONTINUOUS EXECUTION = TRUE
AUTO CONTINUE = TRUE
TODO = ALWAYS UPDATED
TELEGRAM = ENABLED
MASTER FAILOVER = ENABLED
WORKER FALLBACK = ENABLED
MAX REASONING = TRUE
GIT COMMIT = FALSE
GIT PUSH = FALSE
```
# PATCH — THAY ĐỔI KIẾN TRÚC WORKER

## MỤC TIÊU

Không hard-code các worker:

* GLM 5.3 Flash
* GLM 5.2
* Space Bunny

vì các model này có thể có free quota/token limit hoặc availability không ổn định.

Thay vào đó, WORKER SYSTEM phải sử dụng **Dynamic Free Model Discovery**.

---

## 1. FREE MODEL DISCOVERY

Khi setup:

1. Kiểm tra OpenCode version hiện tại.
2. Kiểm tra toàn bộ provider đang khả dụng.
3. Kiểm tra danh sách model hiện tại.
4. Xác định model nào được provider đánh dấu FREE.
5. Xác định:

   * model ID;
   * provider;
   * input/output pricing;
   * context length nếu có;
   * tool calling;
   * reasoning support;
   * availability;
   * model capabilities.
6. Chỉ sau đó mới xây dựng Worker Registry.

Không tự bịa model ID.

Không giả định model hôm nay còn tồn tại trong tương lai.

---

# 2. ƯU TIÊN OPENCode FREE MODELS

Nếu OpenCode hiện tại cung cấp các model Free ổn định, ưu tiên chúng làm WORKER.

Ví dụ có thể phát hiện:

* DeepSeek V4 Flash Free
* MiMo-V2.5 Free
* Ling 3.0 Flash Fin Free
* Nemotron 3 Ultra Free
* Nemotron 3.5 Lightning Free
* Muse Spark Contributor Free
* Big Pickle

Danh sách trên chỉ là ví dụ.

**Không hard-code danh sách này.**

Phải discover danh sách thực tế tại thời điểm triển khai.

---

# 3. WORKER REGISTRY

Tạo Worker Registry động.

Concept:

```yaml
workers:

  audit:
    candidates:
      - model_a
      - model_b
      - model_c

  testing:
    candidates:
      - model_a
      - model_d

  debugging:
    candidates:
      - model_b
      - model_c

  documentation:
    candidates:
      - model_c
      - model_e
```

Candidate list được xây dựng dựa trên capability của model.

Không chỉ dựa trên tên model.

---

# 4. CAPABILITY MATCHING

Mỗi worker task phải có capability requirement.

Ví dụ:

```text
AUDIT
TEST
DEBUG
DOCUMENTATION
FORMAT
RESEARCH
CODE_REVIEW
NOTIFICATION
```

Router chọn:

```text
TASK CAPABILITY
        ↓
AVAILABLE FREE MODELS
        ↓
CAPABILITY MATCH
        ↓
HEALTH CHECK
        ↓
SELECT WORKER
```

---

# 5. FREE MODEL HEALTH

Một model Free có thể:

```text
AVAILABLE
RATE_LIMITED
QUOTA_EXCEEDED
TEMPORARILY_UNAVAILABLE
MODEL_REMOVED
PROVIDER_ERROR
AUTH_ERROR
```

Không được coi tất cả là cùng một lỗi.

---

# 6. WORKER FAILOVER

Ví dụ:

```text
TASK = AUDIT

Worker A
  ↓
RATE LIMIT
  ↓
Worker B
  ↓
SUCCESS
```

Nếu B cũng lỗi:

```text
Worker B
  ↓
FAILED
  ↓
Worker C
```

Nếu không còn worker phù hợp:

```text
NO WORKER AVAILABLE
        ↓
BLOCK TASK
        ↓
TELEGRAM ALERT
        ↓
USER CAN REPLACE WORKER
```

---

# 7. DYNAMIC WORKER REPLACEMENT

Tôi muốn có khả năng thay worker mà không thay architecture.

Ví dụ:

```text
Nemotron 3 Ultra Free
        ↓
UNAVAILABLE
```

Telegram:

```text
[WORKER ALERT]

Worker:
Nemotron 3 Ultra Free

Status:
UNAVAILABLE

Affected capability:
AUDIT

Available alternatives:
MiMo-V2.5 Free
Big Pickle
Ling 3.0 Flash Fin Free
```

Sau đó tôi có thể thay model trong registry.

Không được sửa MASTER logic.

---

# 8. MASTER VẪN GIỮ NGUYÊN

MASTER vẫn:

```text
DeepSeek V4.1 Flash
```

Provider priority:

```text
1. Command Goat
2. OpenCode Go
3. Cline/OpenCode DeepSeek V4 Flash Free
```

Worker system không được ảnh hưởng đến MASTER routing.

---

# 9. REASONING

Tất cả model phải sử dụng mức reasoning cao nhất mà model/provider thực sự hỗ trợ.

Không được tự bịa:

```text
reasoningEffort
thinking
budgetTokens
```

Nếu provider/model không hỗ trợ parameter đó:

```text
REASONING CONFIGURATION NOT AVAILABLE
```

và ghi rõ trong discovery report.

---

# 10. IMPORTANT

Không được coi:

```text
FREE
```

đồng nghĩa:

```text
UNLIMITED
```

Architecture phải luôn giả định:

```text
FREE MODEL MAY DISAPPEAR
FREE MODEL MAY RATE LIMIT
FREE MODEL MAY HAVE QUOTA
FREE MODEL MAY BE TEMPORARILY DISABLED
```

Do đó:

```text
DYNAMIC DISCOVERY
+
HEALTH CHECK
+
FAILOVER
+
WORKER REGISTRY
+
TELEGRAM ALERT
```

là bắt buộc.

---

# 11. DISCOVERY REPORT

Tạo:

```text
MULTI_AI_FREE_MODELS.md
```

Ghi:

```text
Provider
Model
Model ID
Free/Paid
Input Cost
Output Cost
Context
Reasoning
Tool Calling
Capabilities
Current Availability
Fallback Priority
```

Không được ghi thông tin nếu chưa kiểm chứng.

---

# 12. ACCEPTANCE TEST

Phải test:

```text
Worker A available
        ↓
Task executes
```

Sau đó mô phỏng:

```text
Worker A unavailable
        ↓
Worker B selected
```

Sau đó:

```text
Worker A unavailable
Worker B unavailable
        ↓
Worker C selected
```

Cuối cùng:

```text
ALL WORKERS UNAVAILABLE
        ↓
BLOCK
        ↓
TELEGRAM ALERT
```

Không được để MASTER crash chỉ vì worker hết quota.

---

# 13. FINAL ARCHITECTURE

Mục tiêu:

```text
                 MASTER
        DeepSeek V4.1 Flash
                  │
       ┌──────────┴──────────┐
       │                     │
 Command Goat            OpenCode Go
       │                     │
       └──────────┬──────────┘
                  │
              FAILOVER
                  │
                  ▼
       DeepSeek V4 Flash Free
                  │
──────────────────┼──────────────────
                  │
                  ▼
             WORKER ROUTER
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
     AUDIT      TEST       DEBUG
       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
        DYNAMIC FREE MODELS

        MiMo Free
        Nemotron Free
        Ling Free
        Big Pickle
        Muse Spark Free
        ...
                  │
                  ▼
          TELEGRAM MONITOR
```

**Nguyên tắc cuối cùng:**

```text
MASTER = STABLE
WORKERS = DYNAMIC
FREE MODELS = REPLACEABLE
FAILURE = EXPECTED
FALLBACK = AUTOMATIC
TELEGRAM = ALERT
```
