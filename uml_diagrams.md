# UML Diagrams for Ticket System

This document contains the UML diagrams for the ticket system, including use case, activity, sequence, and flow diagrams for each module.

---

## 1. 會員管理模組 (Member Management Module)

### Use Case Diagram
```plantuml
@startuml
left to right direction

' Actor on the left
actor "使用者" as User
actor "管理員" as Admin
' Actors on the right
actor "主辦方" as org
actor "工作人員" as stuff

rectangle "會員/帳號管理" {
  usecase "註冊" as register
  usecase "登入" as login
  usecase "檢視個人資料" as view_profile
  usecase "編輯個人資料" as edit_profile
  usecase "刪除帳號" as delete_account
  usecase "新增/管理帳號" as manage_users

  User -- register
  User -- login
  User -- view_profile
  User -- edit_profile
  User -- delete_account
  
  Admin -- login
  Admin -- view_profile
  Admin -- edit_profile
  Admin -- manage_users

  login -- org
  view_profile -- org
  edit_profile -- org

  login -- stuff
  view_profile -- stuff
  edit_profile -- stuff
}
@enduml
```

### 註冊流程
#### Activity Diagram
```plantuml
@startuml
title 註冊活動圖
start
:使用者輸入註冊資料 (姓名、信箱、密碼);
:系統驗證輸入;
if () then ([資料有效])
  :建立新的會員帳號;
  :發送驗證信;
  :顯示註冊成功訊息;
else ([資料無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 註冊循序圖
actor User
participant System
database Database

User -> System: 提交註冊資料 (姓名、信箱、密碼)
System -> System: 驗證資料格式與內容
alt 資料有效
    System -> Database: 檢查信箱是否已存在
    Database --> System: 回傳檢查結果
    alt 信箱未被註冊
        System -> Database: 建立新的使用者紀錄
        Database --> System: 確認紀錄已建立
        System -> System: 發送驗證信件
        System --> User: 顯示註冊成功頁面
    else 信箱已被註冊
        System --> User: 顯示信箱已被註冊的錯誤訊息
    end
else 資料無效
    System --> User: 顯示輸入資料無效的錯誤訊息
end
@enduml
```

### 登入流程
#### Activity Diagram
```plantuml
@startuml
title 登入活動圖
start
:使用者輸入信箱與密碼;
:系統驗證輸入格式;
if (格式是否正確?) then ([是])
  :系統查詢資料庫中的使用者;
  if () then ([使用者存在])
    :驗證密碼;
    if () then ([密碼正確])
      :授予存取權限;
      :顯示登入成功頁面;
    else ([密碼錯誤])
      :顯示密碼錯誤訊息;
    endif
  else ([使用者不存在])
    :顯示使用者不存在訊息;
  endif
else ([格式錯誤])
  :顯示輸入格式錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
skinparam linetype ortho
title 登入循序圖
actor Member
participant System
database Database

Member -> System: 輸入信箱與密碼
System -> Database: 查詢符合信箱的使用者
Database --> System: 回傳使用者資料 (或 null)
alt 驗證成功
    System -> System: 驗證密碼
    System --> Member: 授予存取權限，登入成功
else 驗證失敗
    System --> Member: 顯示錯誤訊息
end
@enduml
```

---

## 2. 場地與演唱會管理模組 (Venue and Concert Management Module)

### Use Case Diagram
```plantuml
@startuml
left to right direction
' Actor on the left
actor "管理員" as Admin
' Actors on the right
actor "主辦單位" as Organizer


rectangle "場地與演唱會管理" {
  Admin -- (新增場地)
  Admin -- (編輯場地)
  Admin -- (刪除場地)
  Admin -- (檢視場地)
  Admin -- (建立演唱會)
  Admin -- (編輯演唱會)
  Admin -- (刪除演唱會)
  Admin -- (檢視演唱會)
  (檢視場地) -- Organizer
  (建立演唱會) -- Organizer
  (編輯演唱會) -- Organizer
  (刪除演唱會) -- Organizer
  (檢視演唱會) -- Organizer  

}
@enduml
```

### 建立演唱會流程
#### Activity Diagram
```plantuml
@startuml
title 建立演唱會活動圖
start
:主辦單位或管理員提供演唱會詳細資料 (名稱、日期、場地);
:系統驗證資料;
if () then ([資料有效])
  :在資料庫中建立演唱會紀錄;
  :系統確認建立;
  :顯示成功訊息;
else ([資料無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 建立演唱會循序圖
actor "主辦方/管理員" as User
participant System
database Database

User -> System: 請求建立演唱會
System --> User: 顯示建立演唱會表單
User -> System: 提交演唱會詳細資料 (名稱、描述、場地)
System -> Database: 插入新的演唱會紀錄
Database --> System: 確認插入成功
System --> User: 顯示成功訊息
@enduml
```

### 新增場地流程
#### Activity Diagram
```plantuml
@startuml
title 新增場地活動圖
start
:管理員請求新增場地;
:系統顯示新增場地表單;
:管理員輸入場地資料 (名稱、地點、容量);
:系統驗證輸入資料;
if () then ([資料有效])
  :在資料庫中建立場地紀錄;
  :系統確認建立;
  :顯示成功訊息;
else ([資料無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 新增場地循序圖
actor Admin
participant System
database Database

Admin -> System: 請求新增場地
System --> Admin: 顯示新增場地表單
Admin -> System: 提交場地詳細資料 (名稱、容量、地址)
System -> Database: 插入新的場地紀錄
Database --> System: 確認插入成功
System --> Admin: 顯示成功訊息
@enduml
```

---

## 3. 場次與票種管理模組 (Event and Ticket Type Management Module)

### Use Case Diagram
```plantuml
@startuml
left to right direction
' Actor on the left
actor "主辦方" as Organizer
' Actors on the right
actor "管理員" as Admin


rectangle "場次與票種管理" {
  Organizer -- (新增場次)
  Organizer -- (編輯場次)
  Organizer -- (刪除場次)
  Organizer -- (新增票種)
  Organizer -- (編輯票種)
  Organizer -- (刪除票種)
  Organizer -- (設定票價)
  Organizer -- (設定票券數量)
  (新增場次) -- Admin
  (編輯場次) -- Admin
  (刪除場次) -- Admin
  (新增票種) -- Admin
  (編輯票種) -- Admin
  (刪除票種) -- Admin
  (設定票價) -- Admin
  (設定票券數量) -- Admin
}
@enduml
```

### 新增場次流程
#### Activity Diagram
```plantuml
@startuml
title 新增場次活動圖
start
:"主辦方/管理員" 選擇演唱會;
:輸入場次詳細資料 (開始時間, 結束時間);
:系統驗證資料;
if () then ([資料有效])
  :建立場次紀錄;
  :顯示成功訊息;
else ([資料無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 新增場次循序圖
actor "主辦方/管理員" as User
participant System
database Database

User -> System: 請求新增場次
System --> User: 顯示新增場次表單
User -> System: 提交場次資料
System -> Database: 插入新的場次紀錄
Database --> System: 確認插入成功
System --> User: 顯示成功訊息
@enduml
```

### 新增票種流程
#### Activity Diagram
```plantuml
@startuml
title 新增票種活動圖
start
:"主辦方/管理員" 選擇一個演唱會場次;
:輸入票種詳細資料 (名稱、價格、數量);
:系統驗證輸入;
if () then ([資料有效])
  :建立票種紀錄;
  :系統確認;
  :顯示成功訊息;
else ([資料無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 新增票種循序圖
actor "主辦方/管理員" as User
participant System
database Database

User -> System: 請求新增票種
System --> User: 顯示新增票種表單
User -> System: 提交票種資料 (名稱, 價格, 數量)
System -> Database: 插入新的票種紀錄
Database --> System: 確認插入成功
System --> User: 顯示成功訊息
@enduml
```

### 設定票價流程
#### Activity Diagram
```plantuml
@startuml
title 設定票價活動圖
start
:"主辦方/管理員" 選擇要編輯的票種;
:系統顯示目前票價;
:輸入新的票價;
:系統驗證價格;
if () then ([價格有效])
  :更新票種價格;
  :顯示成功訊息;
else ([價格無效])
  :顯示錯誤訊息;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 設定票價循序圖
actor "主辦方/管理員" as User
participant System
database Database

User -> System: 選擇要編輯的票種
System -> Database: 取得票種詳細資料
Database --> System: 回傳票種詳細資料
System --> User: 顯示包含目前價格的編輯表單
User -> System: 提交新價格
System -> Database: 更新票種價格
Database --> System: 確認更新成功
System --> User: 顯示成功訊息
@enduml
```

---

## 4. 訂單與票劵管理模組 (Order and Ticket Management Module)

### Use Case Diagram
```plantuml
@startuml
!pragma usecase
left to right direction

actor "一般使用者/會員" as Member
actor "工作人員" as Staff
' Actors on the right
actor "管理者" as Admin
actor "主辦方(自己的活動)" as org
actor "金流閘道" as PaymentGateway
actor "系統" as System

rectangle "購票與票劵管理" {
  Member -- (選擇票券)
  Member -- (建立訂單)
  Member -- (進行付款)
  (進行付款) -- PaymentGateway
  Member -- (接收實體/電子票券)
  Member -- (檢視訂單歷史)
  Member -- (申請退票)
  Staff -- (驗證票券)
  (審查退票) -- Admin
  (審查退票) -- org  
  (審查退票) -- System
}
@enduml
```

### 購票流程
#### Activity Diagram
```plantuml
@startuml
title 購票活動圖
start
:會員選擇演唱會與票種;
:前往結帳;
:系統建立待處理訂單;
:會員輸入付款資訊;
:系統重新導向至金流閘道;
:金流閘道處理付款;
if () then ([付款成功])
  :金流閘道通知系統;
  :系統確認訂單並生成電子票券;
  :系統發送確認信與電子票券給會員;
else ([付款失敗])
  :金流閘道通知系統;
  :系統取消待處理訂單;
  :系統通知會員付款失敗;
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 建立訂單循序圖
actor Member
participant System
participant PaymentGateway
database Database

Member -> System: 選擇好要購買的場次與票種
Member -> System: 點擊「結帳」
System -> Database: 建立狀態為「待處理」的訂單
Database --> System: 回傳訂單 ID
System -> PaymentGateway: 使用訂單 ID 和金額啟動付款
PaymentGateway --> Member: 提示輸入付款詳細資料
Member -> PaymentGateway: 提交付款詳細資料
PaymentGateway --> System: 發送付款狀態 (成功/失敗)
alt 付款成功
    System -> Database: 更新訂單狀態為「已完成」
    System -> Database: 生成票券
    System --> Member: 顯示訂單確認頁面
else 付款失敗
    System -> Database: 更新訂單狀態為「已取消」
    System --> Member: 顯示付款失敗頁面
end
@enduml
```

### 取消訂單/退票流程
#### Activity Diagram
```plantuml
@startuml activity
title 退票活動圖

start

:會員請求退票訂單;
:系統檢查票種狀態與取消政策;

if (允許取消?) then ([是])

  :檢查是否在可自動退票時限內;

  if (在自動退票時限內?) then ([是])
    :更新訂單狀態為「已取消」;
    :處理退款 (如果適用);
    :發送取消確認通知;
    :顯示取消成功訊息;
  else ([超過自動退票時限])
    :將退票申請送審至管理員／主辦方;
    :管理員／主辦方審查退票;
    if (審查通過?) then ([是])
      :更新訂單狀態為「已取消」;
      :處理退款 (如果適用);
      :發送取消確認通知;
      :顯示取消成功訊息;
    else ([審查不通過])
      :顯示退票申請被拒絕訊息;
    endif
  endif

else ([否])
  :顯示無法取消的訊息;
endif

stop

@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 取消訂單循序圖
actor Member
participant System
database Database
participant PaymentGateway

Member -> System: 請求取消訂單
System -> Database: 查詢訂單狀態
Database --> System: 回傳訂單狀態
alt 訂單可取消
    System -> Database: 更新訂單狀態為「已取消」
    Database --> System: 確認更新
    System -> PaymentGateway: (如果已付款) 請求退款
    PaymentGateway --> System: 回傳退款狀態
    System --> Member: 顯示取消成功並通知退款
else 訂單不可取消
    System --> Member: 顯示無法取消訊息
end
@enduml
```

### 驗證票券流程
#### Activity Diagram
```plantuml
@startuml
title 驗證票券活動圖
actor Staff
start
:工作人員使用裝置掃描票券 QR Code;
:系統接收 QR Code 資料;
:系統查詢票券狀態;
if () then ([票券有效])
  :更新票券狀態為「已使用」;
  :顯示驗證成功訊息;
else ([票券無效或已使用])
  :顯示驗證失敗訊息 (例如: 無效、已使用);
endif
stop
@enduml
```
#### Sequence Diagram
```plantuml
@startuml
title 驗證票券循序圖
actor Staff
participant System
database Database

Staff -> System: 掃描票券 QR Code
System -> Database: 查詢票券狀態
Database --> System: 回傳票券狀態
alt 票券有效
    System -> Database: 更新票券狀態為「已使用」
    Database --> System: 確認更新
    System --> Staff: 顯示驗證成功訊息
else 票券無效
    System --> Staff: 顯示驗證失敗訊息
end
@enduml
```

---

## 會員管理模組 類別圖
```plantuml
@startuml
skinparam linetype polyline
class Member {
  - id: String
  - name: String
  - email: String
  - password: String
  - phone: String
  - status: String
  + register()
  + login()
  + editProfile()
  + deleteAccount()
}

class Admin {
  - id: String
  - name: String
  - email: String
  - password: String
  + manageUsers()
  + login()
}

class Organizer {
  - id: String
  - name: String
  - email: String
  - password: String
  + manageConcerts()
}

class Staff {
  - id: String
  - name: String
  - email: String
  - password: String
  + verifyTicket()
}

Member <|-- Admin
Member <|-- Organizer
Member <|-- Staff
@enduml
```

---

## 場地與演唱會管理模組 類別圖
```plantuml
@startuml
skinparam linetype ortho
class Admin {
  +id: int
  +name: String
  +email: String
  +權限: String
}

class Organizer {
  +id: int
  +name: String
  +organization: String
  +email: String
}

class Venue {
  +id: int
  +name: String
  +location: String
  +capacity: int
  +status: String
}

class Concert {
  +id: int
  +name: String
  +description: String
  +date: Date
  +status: String
}

' 關聯
Organizer "1" --> "0..*" Concert : 建立
Admin "1" --> "0..*" Venue : 管理
Venue "1" <-- "1" Concert : 使用
Admin "1" --> "0..*" Concert : 審查或協助

@enduml

```

---

## 場次與票種管理模組 類別圖
```plantuml
@startuml
skinparam linetype ortho
title 場次與票種管理模組 - 類別圖

class Concert {
  +id: int
  +name: String
  +description: String
  +date: Date
  +status: String
}

class EventSession {
  +id: int
  +concertId: int
  +startTime: DateTime
  +endTime: DateTime
  +status: String
}

class TicketType {
  +id: int
  +eventSessionId: int
  +name: String
  +price: float
  +quantity: int
  +status: String
}

class Admin {
  +id: int
  +name: String
  +email: String
}

class Organizer {
  +id: int
  +name: String
  +organization: String
  +email: String
}

' 關聯
Concert "1" --> "0..*" EventSession : 包含場次
EventSession "1" --> "0..*" TicketType : 包含票種
Organizer "1" --> "0..*" EventSession : 建立
Admin "1" --> "0..*" EventSession : 管理
Organizer "1" --> "0..*" TicketType : 設定
Admin "1" --> "0..*" TicketType : 調整/審核

@enduml

```

---

## 購票與票劵管理模組 類別圖
```plantuml
@startuml
skinparam linetype ortho
' === 主要類別 ===
class Member {
  +id: int
  +name: String
  +email: String
}

class Admin {
  +id: int
  +name: String
}

class Organizer {
  +id: int
  +name: String
  +organization: String
}

class EventSession {
  +id: int
  +concertId: int
  +startTime: DateTime
  +endTime: DateTime
}

class TicketType {
  +id: int
  +eventSessionId: int
  +name: String
  +price: float
  +quantity: int
}

class Order {
  +id: int
  +memberId: int
  +status: String
  +paymentStatus: String
  +createdAt: DateTime
}

class Ticket {
  +id: int
  +orderId: int
  +ticketTypeId: int
  +qrCode: String
  +status: String
}

' === 系統應用邏輯核心 ===
class System {
  +createOrder()
  +generateTicket()
  +validateQRCode()
  +checkAutoRefundEligibility()
  +submitRefundReview()
}

' === 外部服務 ===
class PaymentGateway <<external>> {
  +processPayment()
  +refund()
}

note right of PaymentGateway
金流服務商（例如Line、信用卡）
end note

note right of System
系統核心邏輯：負責處理訂單、
退票條件判斷、票券驗證與生成
end note

' === 關聯 ===
Member "1" --> "0..*" Order : 建立
Order "1" --> "1..*" Ticket : 包含
Ticket "1" --> "1" TicketType : 對應票種
TicketType "1" --> "1" EventSession : 屬於場次
EventSession "1" --> "0..*" Order : 購票來源
Organizer "1" --> "0..*" TicketType : 設定
Admin "1" --> "0..*" Order : 審查退票
Organizer "1" --> "0..*" Order : 審查退票

' 系統行為與邏輯依賴（非資料儲存）
System ..> PaymentGateway : 呼叫付款/退款 API
System ..> Order : 建立與更新
System ..> Ticket : 建立與驗證
System ..> TicketType : 讀取價格/數量
System ..> EventSession : 判斷退票時限

@enduml


```

