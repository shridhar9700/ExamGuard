export type SubjectKey = 'DSA' | 'OS' | 'DBMS' | 'CN' | 'OOP';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface BankQuestion {
  id: string;
  subject: SubjectKey;
  subjectName: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  defaultMarks: number;
  defaultNegativeMarks: number;
}

export const CS_SUBJECTS: { key: SubjectKey; name: string; description: string }[] = [
  { key: 'DSA', name: 'Data Structures & Algorithms', description: 'Trees, Graphs, Sorting, Hashing, Dynamic Programming, Time Complexity' },
  { key: 'OS', name: 'Operating Systems', description: 'Processes, Threads, CPU Scheduling, Deadlocks, Virtual Memory, Paging' },
  { key: 'DBMS', name: 'Database Management Systems', description: 'SQL, Normalization (1NF-BCNF), Transactions, ACID, Indexing, B+ Trees' },
  { key: 'CN', name: 'Computer Networks', description: 'OSI Model, TCP/UDP, IP Subnetting, Routing, DNS, HTTP/HTTPS, Congestion Control' },
  { key: 'OOP', name: 'Object-Oriented Programming & Design', description: 'Polymorphism, Inheritance, Encapsulation, SOLID principles, Design Patterns' },
];

export const CS_QUESTION_BANK: BankQuestion[] = [
  // ==========================================
  // DATA STRUCTURES & ALGORITHMS (DSA)
  // ==========================================
  {
    id: 'dsa_e_1',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Asymptotic Analysis',
    difficulty: 'Easy',
    questionText: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black Tree) with n nodes?',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(log n)' },
      { id: 'C', text: 'O(n)' },
      { id: 'D', text: 'O(n log n)' },
    ],
    correctOptionId: 'B',
    explanation: 'A balanced BST guarantees height of O(log n). Each comparison eliminates half of the remaining subtree, yielding worst-case search complexity of O(log n).',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_e_2',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Arrays & Stacks',
    difficulty: 'Easy',
    questionText: 'Which data structure follows the LIFO (Last In First Out) principle and is used internally for recursion call stacks?',
    options: [
      { id: 'A', text: 'Queue' },
      { id: 'B', text: 'Stack' },
      { id: 'C', text: 'Circular Linked List' },
      { id: 'D', text: 'Binary Heap' },
    ],
    correctOptionId: 'B',
    explanation: 'A Stack operates strictly on Last In First Out (LIFO). Function invocation call frames and expression evaluations rely on stack semantics.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_e_3',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Hashing',
    difficulty: 'Easy',
    questionText: 'What is the average-case time complexity for insertion and lookup operations in a well-distributed Hash Table?',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(log n)' },
      { id: 'C', text: 'O(n)' },
      { id: 'D', text: 'O(n^2)' },
    ],
    correctOptionId: 'A',
    explanation: 'With a uniform hash function and appropriate load factor, hash collisions are minimal, providing constant O(1) average lookup and insertion time.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_m_1',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Sorting Algorithms',
    difficulty: 'Medium',
    questionText: 'Which sorting algorithm has a worst-case time complexity of O(n log n) and is NOT in-place in its standard implementation?',
    options: [
      { id: 'A', text: 'Quick Sort' },
      { id: 'B', text: 'Merge Sort' },
      { id: 'C', text: 'Heap Sort' },
      { id: 'D', text: 'Insertion Sort' },
    ],
    correctOptionId: 'B',
    explanation: 'Merge Sort requires O(n) auxiliary space to merge sorted halves, making it not in-place, but guarantees O(n log n) worst-case time complexity.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_m_2',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Graph Algorithms',
    difficulty: 'Medium',
    questionText: 'Dijkstra\'s shortest path algorithm fails or produces incorrect results in which of the following scenarios?',
    options: [
      { id: 'A', text: 'Graphs with directed cycles' },
      { id: 'B', text: 'Graphs with negative edge weights' },
      { id: 'C', text: 'Dense undirected graphs' },
      { id: 'D', text: 'Graphs with multiple connected components' },
    ],
    correctOptionId: 'B',
    explanation: 'Dijkstra assumes that adding an edge can never decrease total path cost. When negative edges exist, the greedy choice fails, and Bellman-Ford must be used instead.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_m_3',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Trees & Heaps',
    difficulty: 'Medium',
    questionText: 'What is the tight time complexity of building a Max-Heap from an unsorted array of n elements using the bottom-up Heapify approach?',
    options: [
      { id: 'A', text: 'O(n log n)' },
      { id: 'B', text: 'O(n)' },
      { id: 'C', text: 'O(log n)' },
      { id: 'D', text: 'O(n^2)' },
    ],
    correctOptionId: 'B',
    explanation: 'The bottom-up build-heap algorithm visits nodes level by level. Summing node heights yields a convergent geometric series n * sum(h / 2^h) = O(n).',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_h_1',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    questionText: 'In the 0/1 Knapsack problem with n items and capacity W, why is the dynamic programming solution classified as pseudo-polynomial time rather than polynomial time?',
    options: [
      { id: 'A', text: 'Its execution time depends on the value of W, which is exponential in terms of the input bit-length log(W)' },
      { id: 'B', text: 'It requires exponential space in the number of items n' },
      { id: 'C', text: 'It uses memoization instead of iterative tabulation' },
      { id: 'D', text: 'The recurrence relation has overlapping subproblems of logarithmic depth' },
    ],
    correctOptionId: 'A',
    explanation: 'The running time is O(n * W). Input size of W is represented using log2(W) bits. Since O(n * 2^k) where k = bits(W), complexity is exponential in input size.',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dsa_h_2',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    topic: 'Graph Theory & Disjoint Sets',
    difficulty: 'Hard',
    questionText: 'When implementing Kruskal\'s Minimum Spanning Tree algorithm using Disjoint Set Union (DSU) with union-by-rank and path compression, what is the amortized per-operation time complexity?',
    options: [
      { id: 'A', text: 'O(log* n) or Inverse Ackermann alpha(n)' },
      { id: 'B', text: 'Strict O(1)' },
      { id: 'C', text: 'O(log n)' },
      { id: 'D', text: 'O(sqrt(n))' },
    ],
    correctOptionId: 'A',
    explanation: 'With both path compression and union by rank, DSU operations run in O(alpha(n)) amortized time, where alpha is the inverse Ackermann function (effectively <= 4 for any practical input).',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },

  // ==========================================
  // OPERATING SYSTEMS (OS)
  // ==========================================
  {
    id: 'os_e_1',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'Process & Thread Management',
    difficulty: 'Easy',
    questionText: 'Which of the following resources is shared between multiple threads belonging to the same process?',
    options: [
      { id: 'A', text: 'Stack space and CPU register state' },
      { id: 'B', text: 'Heap memory, code section, and open file descriptors' },
      { id: 'C', text: 'Program Counter (PC)' },
      { id: 'D', text: 'Thread Local Storage (TLS)' },
    ],
    correctOptionId: 'B',
    explanation: 'Threads of the same process share the process address space (Code, Data, Heap segments) and OS resources like file descriptors, but maintain separate stacks and register contexts.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'os_e_2',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'Memory Management',
    difficulty: 'Easy',
    questionText: 'What hardware component is responsible for translating virtual memory addresses into physical RAM addresses in real time?',
    options: [
      { id: 'A', text: 'ALU (Arithmetic Logic Unit)' },
      { id: 'B', text: 'MMU (Memory Management Unit)' },
      { id: 'C', text: 'DMA Controller' },
      { id: 'D', text: 'System Bus Arbiter' },
    ],
    correctOptionId: 'B',
    explanation: 'The Memory Management Unit (MMU) uses page tables and the Translation Lookaside Buffer (TLB) to translate virtual addresses generated by the CPU into physical addresses.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'os_m_1',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'Deadlock Handling',
    difficulty: 'Medium',
    questionText: 'Which of the following is NOT one of the four necessary and sufficient Coffman conditions for a deadlock to occur?',
    options: [
      { id: 'A', text: 'Mutual Exclusion' },
      { id: 'B', text: 'Hold and Wait' },
      { id: 'C', text: 'Preemption of Allocated Resources' },
      { id: 'D', text: 'Circular Wait' },
    ],
    correctOptionId: 'C',
    explanation: 'The condition is NO PREEMPTION. If resources can be preempted by the OS scheduler, deadlock cannot persist because the circular wait chain is broken.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'os_m_2',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'Virtual Memory & Paging',
    difficulty: 'Medium',
    questionText: 'What is Belady\'s Anomaly in the context of virtual memory page replacement policies?',
    options: [
      { id: 'A', text: 'Increasing physical page frames increases the page fault rate under FIFO replacement' },
      { id: 'B', text: 'LRU page replacement causes thrashing on sequential array traversals' },
      { id: 'C', text: 'TLB misses degrade CPU pipeline efficiency' },
      { id: 'D', text: 'Optimal replacement produces non-deterministic page hit ratios' },
    ],
    correctOptionId: 'A',
    explanation: 'Belady\'s Anomaly describes the counter-intuitive phenomenon where increasing the number of page frames leads to more page faults for certain access strings under FIFO replacement.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'os_m_3',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'CPU Scheduling',
    difficulty: 'Medium',
    questionText: 'In Round-Robin (RR) CPU scheduling, what happens if the assigned time quantum is set excessively large compared to the burst times?',
    options: [
      { id: 'A', text: 'Context switching overhead dominates CPU execution' },
      { id: 'B', text: 'The scheduling algorithm degenerates into First-Come First-Served (FCFS)' },
      { id: 'C', text: 'Shortest Job First (SJF) optimality is achieved' },
      { id: 'D', text: 'Processes suffer from indefinite starvation' },
    ],
    correctOptionId: 'B',
    explanation: 'If the time quantum exceeds the burst time of every ready process, each process finishes its complete CPU burst without being preempted, behaving identically to FCFS.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'os_h_1',
    subject: 'OS',
    subjectName: 'Operating Systems',
    topic: 'Synchronization & Concurrency',
    difficulty: 'Hard',
    questionText: 'In Peterson\'s solution for 2-process mutual exclusion, what architectural phenomenon on modern out-of-order superscalar CPUs can break its correctness without memory barriers?',
    options: [
      { id: 'A', text: 'CPU instruction reordering and store-buffer forwarding' },
      { id: 'B', text: 'Branch prediction misprediction penalties' },
      { id: 'C', text: 'Page table dirty bit inconsistency' },
      { id: 'D', text: 'Interrupt vector table remapping' },
    ],
    correctOptionId: 'A',
    explanation: 'Modern CPUs reorder independent store and load instructions. Peterson\'s algorithm relies on strict memory ordering: if writes to `flag` and `turn` are reordered, both processes can enter the critical section simultaneously.',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },

  // ==========================================
  // DATABASE MANAGEMENT SYSTEMS (DBMS)
  // ==========================================
  {
    id: 'dbms_e_1',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    topic: 'ACID Properties',
    difficulty: 'Easy',
    questionText: 'Which property of ACID ensures that all operations in a database transaction complete successfully, or none take effect at all?',
    options: [
      { id: 'A', text: 'Atomicity' },
      { id: 'B', text: 'Consistency' },
      { id: 'C', text: 'Isolation' },
      { id: 'D', text: 'Durability' },
    ],
    correctOptionId: 'A',
    explanation: 'Atomicity enforces the "all-or-nothing" rule. If any statement in the transaction fails, the entire transaction is rolled back.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dbms_e_2',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    topic: 'Keys & Relational Integrity',
    difficulty: 'Easy',
    questionText: 'What is a Foreign Key in a relational database management system?',
    options: [
      { id: 'A', text: 'A column used exclusively to encrypt confidential data' },
      { id: 'B', text: 'A field that links a record to the primary key of another table, enforcing referential integrity' },
      { id: 'C', text: 'A temporary index generated by the query optimizer' },
      { id: 'D', text: 'A candidate key that contains null values' },
    ],
    correctOptionId: 'B',
    explanation: 'A Foreign Key matches the Primary Key of another relation to establish and enforce referential integrity between tables.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dbms_m_1',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    topic: 'Normalization',
    difficulty: 'Medium',
    questionText: 'A relation R is in Third Normal Form (3NF) if it is in 2NF and which of the following conditions is satisfied for every functional dependency X -> A?',
    options: [
      { id: 'A', text: 'X is a superkey OR A is a prime attribute (eliminating transitive dependencies)' },
      { id: 'B', text: 'A is a foreign key referencing a primary relation' },
      { id: 'C', text: 'X must be composite and A must be numeric' },
      { id: 'D', text: 'Every non-prime attribute is fully functionally dependent on a subset of the candidate key' },
    ],
    correctOptionId: 'A',
    explanation: '3NF disallows transitive dependencies: for every non-trivial X -> A, either X is a superkey or A is a prime attribute (part of some candidate key).',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dbms_m_2',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    topic: 'Indexing & B+ Trees',
    difficulty: 'Medium',
    questionText: 'Why do relational databases predominantly use B+ Trees rather than standard Binary Search Trees for disk-based table indexing?',
    options: [
      { id: 'A', text: 'B+ Trees have high fanout, minimizing costly random disk I/O operations, and linked leaves enable fast range queries' },
      { id: 'B', text: 'B+ Trees consume zero memory overhead in the buffer pool' },
      { id: 'C', text: 'Binary Search Trees cannot store duplicate keys' },
      { id: 'D', text: 'B+ Trees execute in O(1) time complexity for arbitrary point lookups' },
    ],
    correctOptionId: 'A',
    explanation: 'Disk page block transfers make high branching factor (fanout) vital. B+ Trees keep tree height small (3-4 levels for millions of rows) and leaf sibling pointers allow sequential scan ranges.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'dbms_h_1',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    topic: 'Concurrency Control & Serializability',
    difficulty: 'Hard',
    questionText: 'Under Rigorous Two-Phase Locking (Rigorous 2PL), when are shared (read) and exclusive (write) locks released by a transaction?',
    options: [
      { id: 'A', text: 'All shared and exclusive locks are held until the transaction commits or aborts' },
      { id: 'B', text: 'Shared locks are released as soon as read completes, while exclusive locks are held until commit' },
      { id: 'C', text: 'Locks are released incrementally in the shrinking phase before commit' },
      { id: 'D', text: 'Locks are downgraded to intention locks upon reaching the lock point' },
    ],
    correctOptionId: 'A',
    explanation: 'Rigorous 2PL is stricter than Strict 2PL: all locks (both shared and exclusive) must be retained until the transaction finalizes (commit or abort), preventing cascading rollbacks and guaranteeing conflict serializability.',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },

  // ==========================================
  // COMPUTER NETWORKS (CN)
  // ==========================================
  {
    id: 'cn_e_1',
    subject: 'CN',
    subjectName: 'Computer Networks',
    topic: 'OSI Reference Model',
    difficulty: 'Easy',
    questionText: 'Which layer of the OSI model is responsible for reliable process-to-process communication, segmentation, and flow control?',
    options: [
      { id: 'A', text: 'Network Layer' },
      { id: 'B', text: 'Transport Layer' },
      { id: 'C', text: 'Data Link Layer' },
      { id: 'D', text: 'Session Layer' },
    ],
    correctOptionId: 'B',
    explanation: 'The Transport Layer (Layer 4) handles end-to-end process communication, port multiplexing, reliability, and flow control (e.g. TCP).',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'cn_e_2',
    subject: 'CN',
    subjectName: 'Computer Networks',
    topic: 'IP Addressing & Subnetting',
    difficulty: 'Easy',
    questionText: 'In an IPv4 network with subnet mask /24 (255.255.255.0), how many usable host addresses are available for assignable devices?',
    options: [
      { id: 'A', text: '256' },
      { id: 'B', text: '254' },
      { id: 'C', text: '255' },
      { id: 'D', text: '128' },
    ],
    correctOptionId: 'B',
    explanation: 'An 8-bit host field yields 2^8 = 256 addresses. Two are reserved: the network ID (all 0s) and the broadcast address (all 1s), leaving 254 usable host addresses.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'cn_m_1',
    subject: 'CN',
    subjectName: 'Computer Networks',
    topic: 'Transport Protocols (TCP)',
    difficulty: 'Medium',
    questionText: 'What sequence of flags is exchanged between client and server to establish a standard TCP connection (Three-Way Handshake)?',
    options: [
      { id: 'A', text: 'SYN -> SYN-ACK -> ACK' },
      { id: 'B', text: 'ACK -> SYN -> ACK' },
      { id: 'C', text: 'SYN -> ACK -> FIN' },
      { id: 'D', text: 'RST -> SYN -> ACK' },
    ],
    correctOptionId: 'A',
    explanation: 'Client sends SYN; server responds with SYN-ACK; client acknowledges with ACK, synchronizing Initial Sequence Numbers (ISNs) on both sides.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'cn_m_2',
    subject: 'CN',
    subjectName: 'Computer Networks',
    topic: 'Congestion Control',
    difficulty: 'Medium',
    questionText: 'In TCP Tahoe/Reno congestion control, what happens to the congestion window (cwnd) when a packet loss is detected via Retransmission Timeout (RTO)?',
    options: [
      { id: 'A', text: 'cwnd is halved and linear congestion avoidance continues' },
      { id: 'B', text: 'cwnd is reset to 1 Maximum Segment Size (MSS) and Slow Start initiates' },
      { id: 'C', text: 'cwnd remains constant while ssthresh is doubled' },
      { id: 'D', text: 'TCP switches permanently to UDP mode' },
    ],
    correctOptionId: 'B',
    explanation: 'A timeout is a severe signal of network congestion. TCP sets ssthresh = cwnd / 2, resets cwnd = 1 MSS, and re-enters the exponential Slow Start phase.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'cn_h_1',
    subject: 'CN',
    subjectName: 'Computer Networks',
    topic: 'Subnetting & CIDR Calculation',
    difficulty: 'Hard',
    questionText: 'A router receives a packet destined for IP 192.168.10.138. The routing table contains: (1) 192.168.10.0/24 via Interface A, (2) 192.168.10.128/26 via Interface B, and (3) 192.168.10.136/29 via Interface C. By Longest Prefix Match (LPM), which interface forwards the packet?',
    options: [
      { id: 'A', text: 'Interface A (/24)' },
      { id: 'B', text: 'Interface B (/26)' },
      { id: 'C', text: 'Interface C (/29)' },
      { id: 'D', text: 'Packet is dropped due to ambiguity' },
    ],
    correctOptionId: 'C',
    explanation: '192.168.10.136/29 covers 192.168.10.136 through .143. IP 138 matches all three routes, but /29 has the longest network prefix (29 bits), making Interface C the chosen route.',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },

  // ==========================================
  // OBJECT-ORIENTED PROGRAMMING & DESIGN (OOP)
  // ==========================================
  {
    id: 'oop_e_1',
    subject: 'OOP',
    subjectName: 'Object-Oriented Programming & Design',
    topic: 'Core OOP Principles',
    difficulty: 'Easy',
    questionText: 'Which OOP concept refers to restricting direct access to object state and requiring all interactions to occur through public methods/interfaces?',
    options: [
      { id: 'A', text: 'Encapsulation' },
      { id: 'B', text: 'Polymorphism' },
      { id: 'C', text: 'Inheritance' },
      { id: 'D', text: 'Overloading' },
    ],
    correctOptionId: 'A',
    explanation: 'Encapsulation binds data and the methods operating on that data together, hiding internal implementation details from external callers.',
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  },
  {
    id: 'oop_m_1',
    subject: 'OOP',
    subjectName: 'Object-Oriented Programming & Design',
    topic: 'Polymorphism & Virtual Functions',
    difficulty: 'Medium',
    questionText: 'How is runtime (dynamic) polymorphism typically implemented under the hood in compiled object-oriented languages like C++?',
    options: [
      { id: 'A', text: 'Virtual Method Tables (vtable) and virtual pointers (vptr) per object instance' },
      { id: 'B', text: 'Dynamic name resolution in the symbol table at every invocation' },
      { id: 'C', text: 'Preprocessor macro substitution' },
      { id: 'D', text: 'Static compiler inlining' },
    ],
    correctOptionId: 'A',
    explanation: 'Classes with virtual functions contain a vptr pointing to a compiler-generated vtable array of function pointers, resolving the target method address at runtime.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'oop_m_2',
    subject: 'OOP',
    subjectName: 'Object-Oriented Programming & Design',
    topic: 'SOLID Principles',
    difficulty: 'Medium',
    questionText: 'Which SOLID principle states that derived classes must be completely substitutable for their base classes without altering the correctness of the program?',
    options: [
      { id: 'A', text: 'Single Responsibility Principle (SRP)' },
      { id: 'B', text: 'Liskov Substitution Principle (LSP)' },
      { id: 'C', text: 'Interface Segregation Principle (ISP)' },
      { id: 'D', text: 'Dependency Inversion Principle (DIP)' },
    ],
    correctOptionId: 'B',
    explanation: 'The Liskov Substitution Principle (LSP) mandates that subclasses adhere to the behavioral contract of their base types without throwing unexpected exceptions or violating invariants.',
    defaultMarks: 2,
    defaultNegativeMarks: 0,
  },
  {
    id: 'oop_h_1',
    subject: 'OOP',
    subjectName: 'Object-Oriented Programming & Design',
    topic: 'Design Patterns',
    difficulty: 'Hard',
    questionText: 'In thread-safe lazy-initialization of the Singleton design pattern in Java/C++, why is the "volatile" keyword required alongside Double-Checked Locking (DCL)?',
    options: [
      { id: 'A', text: 'To prevent instruction reordering where memory allocation and reference assignment happen before constructor completion' },
      { id: 'B', text: 'To force the compiler to serialize all calls into a single OS thread' },
      { id: 'C', text: 'To store the singleton instance in CPU L1 cache' },
      { id: 'D', text: 'To automatically invoke garbage collection upon thread death' },
    ],
    correctOptionId: 'A',
    explanation: 'Without `volatile`, the compiler or CPU can reorder the instance pointer assignment before the object constructor completes. Another thread could observe a non-null reference to an uninitialized instance.',
    defaultMarks: 3,
    defaultNegativeMarks: 0,
  },
];

export interface BankFilterParams {
  subject?: string;
  difficulty?: string;
  search?: string;
  count?: number;
}

export function filterQuestionBank(params: BankFilterParams): BankQuestion[] {
  let list = [...CS_QUESTION_BANK];

  if (params.subject && params.subject !== 'ALL') {
    list = list.filter((q) => q.subject === params.subject);
  }

  if (params.difficulty && params.difficulty !== 'ALL' && params.difficulty !== 'MIXED') {
    list = list.filter((q) => q.difficulty === params.difficulty);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.questionText.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q)
    );
  }

  if (params.count && params.count > 0) {
    list = list.slice(0, params.count);
  }

  return list;
}

export function autoGenerateQuestions(options: {
  subject: string;
  difficulty: string;
  count: number;
}): BankQuestion[] {
  let pool = [...CS_QUESTION_BANK];

  if (options.subject && options.subject !== 'ALL') {
    pool = pool.filter((q) => q.subject === options.subject);
  }

  let selected: BankQuestion[] = [];

  if (options.difficulty === 'MIXED') {
    // 40% Easy, 40% Medium, 20% Hard
    const easyCount = Math.max(1, Math.round(options.count * 0.4));
    const medCount = Math.max(1, Math.round(options.count * 0.4));
    const hardCount = Math.max(1, options.count - easyCount - medCount);

    const easyPool = pool.filter((q) => q.difficulty === 'Easy').sort(() => 0.5 - Math.random());
    const medPool = pool.filter((q) => q.difficulty === 'Medium').sort(() => 0.5 - Math.random());
    const hardPool = pool.filter((q) => q.difficulty === 'Hard').sort(() => 0.5 - Math.random());

    selected = [
      ...easyPool.slice(0, easyCount),
      ...medPool.slice(0, medCount),
      ...hardPool.slice(0, hardCount),
    ];
  } else {
    if (options.difficulty && options.difficulty !== 'ALL') {
      pool = pool.filter((q) => q.difficulty === options.difficulty);
    }
    // Shuffle and slice
    selected = pool.sort(() => 0.5 - Math.random()).slice(0, options.count);
  }

  // If pool was smaller than requested count, fill with remaining from broad pool
  if (selected.length < options.count) {
    const remainingNeeded = options.count - selected.length;
    const selectedIds = new Set(selected.map((s) => s.id));
    const fillPool = CS_QUESTION_BANK.filter((q) => !selectedIds.has(q.id)).sort(() => 0.5 - Math.random());
    selected = [...selected, ...fillPool.slice(0, remainingNeeded)];
  }

  return selected;
}
