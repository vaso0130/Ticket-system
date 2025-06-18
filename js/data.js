// Application data and storage keys
export const STORAGE_KEYS = {
  VENUES: 'venues',
  CONCERTS: 'concerts',
  TICKETS: 'tickets',
  CURRENT_USER: 'currentUser',
  CURRENT_ROLE: 'currentRole'
};

// Users: username, password, roles[]
export let users = [
  {username: 'admin', password: 'admin123', roles: ['admin'], email: 'admin@example.com', name: 'Administrator'},
  {username: 'org1', password: 'org123', roles: ['organizer'], email: 'org1@example.com', name: 'Organizer One'},
  {username: 'org2', password: 'org234', roles: ['organizer'], email: 'org2@example.com', name: 'Organizer Two'},
  {username: 'user1', password: 'user123', roles: ['spectator'], email: 'user1@example.com', name: 'User One'},
  {username: 'user2', password: 'user234', roles: ['spectator'], email: 'user2@example.com', name: 'User Two'},
  {username: 'staff1', password: 'staff123', roles: ['staff'], email: 'staff1@example.com', name: 'Staff One'},
  {username: 'multiuser', password: 'multi123', roles: ['admin','organizer'], email: 'multi@example.com', name: 'Multi Role User'},
  {username: 'super', password: 'super123', roles: ['admin', 'organizer', 'spectator', 'staff'], email: 'super@example.com', name: 'Super User'}
];

// Venues database: id, name, location, capacity, seatMap[]
// Each seatMap section: id, name, capacity, seatingType ('numbered' or 'generalAdmission'), rows?, seatsPerRow?
export let venues = [
  {
    id: 1,
    name: '台北小巨蛋',
    location: '台北市信義區',
    capacity: 15000, // This will be the total capacity, sum of section capacities
    seatMap: [
      { id: 'A', name: 'A區', capacity: 5000, seatingType: 'generalAdmission' },
      { id: 'B', name: 'B區', capacity: 5000, seatingType: 'generalAdmission' },
      { id: 'C', name: 'C區', capacity: 4000, seatingType: 'generalAdmission' },
      { id: 'VIP', name: 'VIP區', capacity: 1000, seatingType: 'numbered', rows: 20, seatsPerRow: 50 }
    ]
  },
  {
    id: 2,
    name: '高雄巨蛋',
    location: '高雄市左營區',
    capacity: 13000,
    seatMap: [
      { id: 'Rock', name: '搖滾區', capacity: 6000, seatingType: 'generalAdmission' },
      { id: 'Zone1', name: '一樓座位區', capacity: 4000, seatingType: 'numbered', rows: 40, seatsPerRow: 100 },
      { id: 'Zone2', name: '二樓座位區', capacity: 3000, seatingType: 'numbered', rows: 30, seatsPerRow: 100 }
    ]
  },
  {
    id: 3, // Corrected ID to be unique
    name: "Blue Note Tokyo",
    location: "日本，東京",
    capacity: 300,
    seatMap: [
      { id: "TBL", name: "餐桌席", capacity: 150, seatingType: "numbered", rows: 15, seatsPerRow: 10 }, // Changed to numbered for consistency if applicable
      { id: "CTR", name: "吧台席", capacity: 50, seatingType: "numbered", rows: 5, seatsPerRow: 10 }, // Changed to numbered
      { id: "SOF", name: "沙發區", capacity: 100, seatingType: "generalAdmission" }
    ]
  }
];

// Concerts database: id, title, venueId, organizerId, imageUrl, sessions[]
// Each session: sessionId, dateTime, salesStartDateTime, salesEndDateTime, sections[]
// Each session section: sectionId (matches venue.seatMap.id), price, ticketsAvailable, ticketsSold
export let concerts = [
  {
    id: 1,
    title: "宇宙巨星演唱會：Aria",
    description: "來自銀河系最閃耀的巨星，帶來震撼宇宙的音樂與視覺饗宴。",
    imageUrl: "./media/image/Aria.png",
    category: "流行",
    organizerId: "org1",
    venueId: 1,
    sessions: [
      {
        sessionId: "1-1",
        dateTime: "2025-06-19T19:00:00",
        salesStartDateTime: "2025-05-20T12:00:00",
        salesEndDateTime: "2025-06-18T23:59:59",
        sections: [
          { sectionId: "VIP", price: 5800, ticketsAvailable: 100, ticketsSold: 0 },
          { sectionId: "A", price: 3800, ticketsAvailable: 500, ticketsSold: 0 },
          { sectionId: "B", price: 2800, ticketsAvailable: 1000, ticketsSold: 0 },
          { sectionId: "C", price: 1800, ticketsAvailable: 2000, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "日本偶像團體：愛●魔法少女☆⌒(*＾-゜)v",
    description: "日本超人氣偶像團體首次來台！感受卡哇伊的魔法力量。",
    imageUrl: "./media/image/J-pop.png",
    category: "J-POP",
    organizerId: "org2",
    venueId: 1,
    sessions: [
      {
        sessionId: "2-1",
        dateTime: "2025-08-01T18:30:00",
        salesStartDateTime: "2025-06-01T12:00:00",
        salesEndDateTime: "2025-07-31T23:59:59",
        sections: [
          { sectionId: "VIP", price: 4800, ticketsAvailable: 200, ticketsSold: 0 },
          { sectionId: "A", price: 3200, ticketsAvailable: 800, ticketsSold: 0 },
          { sectionId: "B", price: 2200, ticketsAvailable: 1500, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "韓國女團:No different",
    description: "韓國頂尖女團 No Different 降臨！帶來勁歌熱舞。",
    imageUrl: "./media/image/K-pop.png",
    category: "K-POP",
    organizerId: "org1",
    venueId: 2,
    sessions: [
      {
        sessionId: "3-1",
        dateTime: "2025-08-15T19:30:00",
        salesStartDateTime: "2025-07-10T12:00:00",
        salesEndDateTime: "2025-08-14T23:59:59",
        sections: [
          { sectionId: "Rock", price: 5500, ticketsAvailable: 1000, ticketsSold: 0 },
          { sectionId: "Zone1", price: 4500, ticketsAvailable: 1500, ticketsSold: 0 },
          { sectionId: "Zone2", price: 3500, ticketsAvailable: 2000, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "歐美搖滾樂隊：R0CK N0W",
    description: "歐美傳奇搖滾樂隊 R0CK N0W 強勢回歸！",
    imageUrl: "./media/image/rock.png",
    category: "搖滾",
    organizerId: "org2",
    venueId: 2,
    sessions: [
      {
        sessionId: "4-1",
        dateTime: "2025-09-05T20:00:00",
        salesStartDateTime: "2025-08-01T12:00:00",
        salesEndDateTime: "2025-09-04T23:59:59",
        sections: [
          { sectionId: "Rock", price: 3800, ticketsAvailable: 2000, ticketsSold: 0 },
          { sectionId: "Zone1", price: 2800, ticketsAvailable: 3000, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "地下樂團大集合",
    description: "集結年度最受矚目的地下樂團，帶來最原始、最真實的音樂力量。",
    imageUrl: "./media/image/bank.png",
    category: "獨立音樂",
    organizerId: "org1",
    venueId: 3,
    sessions: [
      {
        sessionId: "5-1",
        dateTime: "2025-09-20T19:00:00",
        salesStartDateTime: "2025-08-15T12:00:00",
        salesEndDateTime: "2025-09-19T23:59:59",
        sections: [
          { sectionId: "TBL", price: 1800, ticketsAvailable: 100, ticketsSold: 0 },
          { sectionId: "CTR", price: 1500, ticketsAvailable: 30, ticketsSold: 0 },
          { sectionId: "SOF", price: 1200, ticketsAvailable: 50, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "台灣男子天團：亂78糟",
    description: "台灣男子天團『亂78糟』感動回歸！用音樂串起共同的青春記憶。",
    imageUrl: "../media/image/T-pop.png",
    category: "華語流行",
    organizerId: "org2",
    venueId: 1,
    sessions: [
      {
        sessionId: "6-1",
        dateTime: "2025-10-10T19:30:00",
        salesStartDateTime: "2025-09-01T12:00:00",
        salesEndDateTime: "2025-10-09T23:59:59",
        sections: [
          { sectionId: "VIP", price: 6200, ticketsAvailable: 150, ticketsSold: 0 },
          { sectionId: "A", price: 4200, ticketsAvailable: 600, ticketsSold: 0 },
          { sectionId: "B", price: 3200, ticketsAvailable: 1200, ticketsSold: 0 },
          { sectionId: "C", price: 2200, ticketsAvailable: 2000, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "電玩主題曲之夜",
    description: "經典電玩主題曲交響音樂會！重溫那些年在虛擬世界中的熱血與感動。",
    imageUrl: "../media/image/game.png",
    category: "遊戲動漫",
    organizerId: "org1",
    venueId: 3,
    sessions: [
      {
        sessionId: "7-1",
        dateTime: "2025-11-01T19:00:00",
        salesStartDateTime: "2025-10-01T12:00:00",
        salesEndDateTime: "2025-10-31T23:59:59",
        sections: [
          { sectionId: "TBL", price: 2500, ticketsAvailable: 80, ticketsSold: 0 },
          { sectionId: "CTR", price: 2000, ticketsAvailable: 40, ticketsSold: 0 },
          { sectionId: "SOF", price: 1800, ticketsAvailable: 60, ticketsSold: 0 }
        ]
      }
    ]
  }
];

// Tickets purchased: ticketId, username, eventId, sessionId, sectionId, purchaseTime, paymentMethod, status, seats[], totalPrice
// seats: [{ row, seat, label: '10排5號' }, { type: 'generalAdmission', description: '自由座' }]
// quantity can be derived from seats.length
export let tickets = [
  // super 預設一張可退票（自由入座）
  {
    ticketId: 'T1750168286859-sup-0-t7pda',
    username: "super",
    concertId: 2,
    sessionId: "2-1",
    sectionId: "VIP",
    purchaseTime: "2025-06-01T10:00:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { row: 'B', seat: 10, label: 'A排10號' }
    ],
    totalPrice: 4800
  },
  // super 預設一張可領票（自由入座）
  {
    ticketId: 'T1750168286860-sup-0-t7pdb',
    username: "super",
    concertId: 1,
    sessionId: "1-1",
    sectionId: "A",
    purchaseTime: "2025-06-17T10:00:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { type: 'generalAdmission', description: '自由入座' }
    ],
    totalPrice: 3800
  },
  // super 預設一張對號入座票（VIP區）
  {
    ticketId: 'T1750168345240-sup-0-t7pdc',
    username: "super",
    concertId: 1,
    sessionId: "1-1",
    sectionId: "VIP",
    purchaseTime: "2025-06-17T10:00:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { row: 'A', seat: 8, label: 'A排8號' }
    ],
    totalPrice: 5800
  },
  // Example: user1 bought 2 tickets for concert 1, session 1-1, section A (numbered)
  {
    ticketId: 'T1750169000001-user1-0-t7pdd',
    username: "user1",
    concertId: 1,
    sessionId: "1-1",
    sectionId: "A",
    purchaseTime: "2025-06-21T10:00:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { row: 10, seat: 5, label: "10排5號" },
      { row: 10, seat: 6, label: "10排6號" }
    ],
    totalPrice: 7600
  },
  {
    ticketId: 'T1750169000002-user2-0-t7pde',
    username: "user2",
    concertId: 2,
    sessionId: "2-1",
    sectionId: "VIP",
    purchaseTime: "2025-07-02T11:30:00",
    paymentMethod: "line_pay",
    status: "pending",
    seats: [
      { row: 1, seat: 1, label: "1排1號" },
      { row: 1, seat: 2, label: "1排2號" }
    ],
    totalPrice: 9600
  },
  {
    ticketId: 'T1750169000003-user1-0-t7pdf',
    username: "user1",
    concertId: 3,
    sessionId: "3-1",
    sectionId: "Rock",
    purchaseTime: "2025-07-11T09:15:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { row: 1, seat: 1, label: "搖滾區-1" },
      { row: 1, seat: 2, label: "搖滾區-2" }
    ],
    totalPrice: 11000
  },
  {
    ticketId: 'T1750169000004-user2-0-t7pdg',
    username: "user2",
    concertId: 4,
    sessionId: "4-1",
    sectionId: "Zone1",
    purchaseTime: "2025-08-02T14:00:00",
    paymentMethod: "credit_card",
    status: "confirmed",
    seats: [
      { row: 15, seat: 10, label: "15排10號" },
      { row: 15, seat: 11, label: "15排11號" }
    ],
    totalPrice: 5600
  }
];
