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
  {username: 'multiuser', password: 'multi123', roles: ['admin','organizer'], email: 'multi@example.com', name: 'Multi Role User'}
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
      { id: 'A', name: 'A區', capacity: 5000, seatingType: 'numbered', rows: 50, seatsPerRow: 100 },
      { id: 'B', name: 'B區', capacity: 5000, seatingType: 'numbered', rows: 50, seatsPerRow: 100 },
      { id: 'C', name: 'C區', capacity: 4000, seatingType: 'generalAdmission' }, // For general admission, rows/seatsPerRow might not be applicable or needed for initial display
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
  }
];

// Concerts database: id, title, venueId, organizerId, imageUrl, sessions[]
// Each session: sessionId, dateTime, salesStartDateTime, salesEndDateTime, sessionImageUrl, sections[]
// Each session section: sectionId (matches venue.seatMap.id), price, ticketsAvailable, ticketsSold
export let concerts = [
  {
    id: 1,
    title: '流行音樂演唱會',
    venueId: 1,
    organizerId: 'org1',
    imageUrl: 'images/concert1_main.jpg', // Example image path
    sessions: [
      {
        sessionId: '1-1',
        dateTime: '2025-09-15T19:00:00',
        salesStartDateTime: '2025-05-01T10:00:00',
        salesEndDateTime: '2025-09-14T23:59:59',
        sessionImageUrl: 'images/concert1_session1.jpg', // Example image path
        sections: [
          { sectionId: 'A', price: 1800, ticketsAvailable: 1500, ticketsSold: 0 },
          { sectionId: 'B', price: 1500, ticketsAvailable: 1500, ticketsSold: 0 },
          { sectionId: 'C', price: 1200, ticketsAvailable: 1200, ticketsSold: 0 },
          { sectionId: 'VIP', price: 3000, ticketsAvailable: 300, ticketsSold: 0 }
        ]
      },
      {
        sessionId: '1-2',
        dateTime: '2025-09-16T19:00:00',
        salesStartDateTime: '2025-08-01T10:00:00',
        salesEndDateTime: '2025-09-15T23:59:59',
        // sessionImageUrl: null, // Can be null to use main event image
        sections: [
          { sectionId: 'A', price: 1900, ticketsAvailable: 1500, ticketsSold: 0 },
          { sectionId: 'B', price: 1600, ticketsAvailable: 1500, ticketsSold: 0 },
          { sectionId: 'C', price: 1300, ticketsAvailable: 1200, ticketsSold: 0 },
          { sectionId: 'VIP', price: 3200, ticketsAvailable: 300, ticketsSold: 0 }
        ]
      }
    ]
  },
  {
    id: 2,
    title: '搖滾之夜',
    venueId: 2,
    organizerId: 'org2',
    imageUrl: 'images/concert2_main.jpg',
    sessions: [
      {
        sessionId: '2-1',
        dateTime: '2025-10-01T20:00:00',
        salesStartDateTime: '2025-08-15T10:00:00',
        salesEndDateTime: '2025-09-30T23:59:59',
        sections: [
          { sectionId: 'Rock', price: 2000, ticketsAvailable: 3000, ticketsSold: 0 },
          { sectionId: 'Zone1', price: 1500, ticketsAvailable: 2000, ticketsSold: 0 },
          { sectionId: 'Zone2', price: 1000, ticketsAvailable: 1500, ticketsSold: 0 }
        ]
      }
    ]
  }
];

// Tickets purchased: ticketId, username, eventId, sessionId, sectionId, purchaseTime, paymentMethod, status, seats[], totalPrice
// seats: [{ row, seat, label }] for 'numbered', [{ type: 'generalAdmission', description }] for 'generalAdmission'
// quantity can be derived from seats.length
export let tickets = [
  // Example: user1 bought 2 tickets for concert 1, session 1-1, section A (numbered)
  {
    ticketId: 'TICKET001',
    username: 'user1',
    eventId: 1,
    sessionId: '1-1',
    sectionId: 'A',
    purchaseTime: '2025-05-10T10:00:00Z',
    paymentMethod: 'Credit Card',
    status: 'confirmed',
    seats: [
      { row: 10, seat: 5, label: '10排5號' },
      { row: 10, seat: 6, label: '10排6號' }
    ],
    totalPrice: 3600 // Assuming price for section A was 1800
  },
  // Example: user2 bought 3 tickets for concert 2, session 2-1, section Rock (general admission)
  {
    ticketId: 'TICKET002',
    username: 'user2',
    eventId: 2,
    sessionId: '2-1',
    sectionId: 'Rock',
    purchaseTime: '2025-08-20T11:00:00Z',
    paymentMethod: 'LINE Pay',
    status: 'confirmed',
    seats: [
      { type: 'generalAdmission', description: '自由座' },
      { type: 'generalAdmission', description: '自由座' },
      { type: 'generalAdmission', description: '自由座' }
    ],
    totalPrice: 6000 // Assuming price for section Rock was 2000
  }
];

// Functions to allow modification of these arrays if needed by other modules
// For now, other modules will import and modify them directly.
// Consider adding dedicated functions here if direct modification becomes problematic.
