import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Proctora Database ---');

  // Clean existing data
  await prisma.testAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Teacher
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@proctora.edu',
      name: 'Dr. Evelyn Vance (Chief Proctor)',
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });
  console.log('Created teacher:', teacher.email);

  // 2. Create Student
  const student = await prisma.user.create({
    data: {
      email: 'student@proctora.edu',
      name: 'Alex Mercer (Candidate #8042)',
      password: hashedPassword,
      role: Role.STUDENT,
    },
  });
  console.log('Created student:', student.email);

  // 3. Create sample comprehensive assessment
  const test1 = await prisma.assessment.create({
    data: {
      title: 'Advanced Computer Networks & Security Protocols',
      description: 'Comprehensive evaluation covering TCP/IP handshake, TLS 1.3 cryptographic primitives, firewall topologies, and zero-trust perimeter defense.',
      accessCode: 'SEC101',
      teacherId: teacher.id,
      examType: 'MCQ',
      durationMinutes: 15,
      perQuestionTimer: false,
      secondsPerQuestion: 60,
      totalMarks: 50,
      passingPercentage: 60,
      showResultImmediately: true,
      maxViolationsAllowed: 3,
      requireCamera: true,
      requireMicrophone: true,
      requireFullscreen: true,
      shuffleQuestions: true,
      isPublished: true,
      questions: {
        create: [
          {
            orderIndex: 0,
            questionText: 'During a standard 3-way TCP handshake, what is the exact packet flag sequence transmitted between the client and server?',
            marks: 10,
            negativeMarks: 2.5,
            options: [
              { id: 'A', text: 'SYN -> SYN-ACK -> ACK' },
              { id: 'B', text: 'ACK -> SYN -> SYN-ACK' },
              { id: 'C', text: 'SYN -> ACK -> RST' },
              { id: 'D', text: 'FIN -> SYN-ACK -> ACK' },
            ],
            correctOptionId: 'A',
            explanation: 'The TCP handshake begins with SYN from client, server responds with SYN-ACK, and client finishes with ACK.',
          },
          {
            orderIndex: 1,
            questionText: 'Which protocol operates at the Transport Layer (Layer 4) and provides connectionless, low-latency transmission without guaranteed packet delivery?',
            marks: 10,
            negativeMarks: 2.5,
            options: [
              { id: 'A', text: 'Transmission Control Protocol (TCP)' },
              { id: 'B', text: 'User Datagram Protocol (UDP)' },
              { id: 'C', text: 'Internet Control Message Protocol (ICMP)' },
              { id: 'D', text: 'Address Resolution Protocol (ARP)' },
            ],
            correctOptionId: 'B',
            explanation: 'UDP provides lightweight, connectionless datagram delivery without error retransmission.',
          },
          {
            orderIndex: 2,
            questionText: 'What fundamental security enhancement does TLS 1.3 introduce compared to TLS 1.2 during session negotiation?',
            marks: 10,
            negativeMarks: 2.5,
            options: [
              { id: 'A', text: 'Removal of RSA key exchange in favor of mandatory Ephemeral Diffie-Hellman (PFS)' },
              { id: 'B', text: 'Mandatory unencrypted SNI extensions for proxy routing' },
              { id: 'C', text: 'Introduction of MD5 hashing for rapid handshake verification' },
              { id: 'D', text: 'Deprecation of AES-GCM cipher suites' },
            ],
            correctOptionId: 'A',
            explanation: 'TLS 1.3 deprecates static RSA key exchange to guarantee Perfect Forward Secrecy (PFS) using (EC)DHE.',
          },
          {
            orderIndex: 3,
            questionText: 'In asymmetric public-key cryptography (e.g. RSA), what is used by the recipient to decrypt a message encrypted with their public key?',
            marks: 10,
            negativeMarks: 2.5,
            options: [
              { id: 'A', text: 'The sender’s public key' },
              { id: 'B', text: 'The recipient’s private key' },
              { id: 'C', text: 'A shared pre-shared symmetric key (PSK)' },
              { id: 'D', text: 'The Certificate Authority root key' },
            ],
            correctOptionId: 'B',
            explanation: 'Messages encrypted with the recipient’s public key can only be decrypted by the matching private key owned exclusively by the recipient.',
          },
          {
            orderIndex: 4,
            questionText: 'Which cyber attack specifically abuses Address Resolution Protocol tables to redirect local LAN packets to an unauthorized attacker node?',
            marks: 10,
            negativeMarks: 2.5,
            options: [
              { id: 'A', text: 'ARP Cache Poisoning / Spoofing' },
              { id: 'B', text: 'DNS Cache Poisoning' },
              { id: 'C', text: 'BGP Hijacking' },
              { id: 'D', text: 'SYN Flood' },
            ],
            correctOptionId: 'A',
            explanation: 'ARP poisoning broadcasts unsolicited ARP replies, overwriting switch/node ARP tables to intercept network traffic.',
          },
        ],
      },
    },
  });

  // 4. Create a second test with Per-Question Timer enabled
  const test2 = await prisma.assessment.create({
    data: {
      title: 'Full-Stack JavaScript & Modern Web Architectures',
      description: 'Rapid-fire assessment with 45-second per-question countdowns testing React virtual DOM, Node.js event loop, and REST vs GraphQL paradigms.',
      accessCode: 'WEB202',
      teacherId: teacher.id,
      examType: 'MCQ',
      durationMinutes: 5,
      perQuestionTimer: true,
      secondsPerQuestion: 45,
      totalMarks: 30,
      passingPercentage: 65,
      showResultImmediately: true,
      maxViolationsAllowed: 2,
      requireCamera: true,
      requireMicrophone: true,
      requireFullscreen: true,
      shuffleQuestions: false,
      isPublished: true,
      questions: {
        create: [
          {
            orderIndex: 0,
            questionText: 'In the Node.js event loop, which phase executes callbacks scheduled by `process.nextTick()`?',
            marks: 10,
            negativeMarks: 0,
            options: [
              { id: 'A', text: 'Microtask queue (immediately after the current operation finishes before any event loop phase)' },
              { id: 'B', text: 'Timers phase' },
              { id: 'C', text: 'Check phase (setImmediate)' },
              { id: 'D', text: 'Poll phase' },
            ],
            correctOptionId: 'A',
            explanation: 'process.nextTick queue is drained immediately after the current operation concludes, ahead of standard event loop phases.',
          },
          {
            orderIndex: 1,
            questionText: 'What is the primary benefit of React Server Components (RSC) in Next.js App Router?',
            marks: 10,
            negativeMarks: 0,
            options: [
              { id: 'A', text: 'Zero client-side JavaScript bundle impact for server components' },
              { id: 'B', text: 'Ability to run browser Web Workers directly in React state' },
              { id: 'C', text: 'Eliminating the need for CSS stylesheets' },
              { id: 'D', text: 'Automatic WebRTC streaming for all components' },
            ],
            correctOptionId: 'A',
            explanation: 'React Server Components execute solely on the server and their code dependencies are not bundled into client JavaScript.',
          },
          {
            orderIndex: 2,
            questionText: 'Which HTTP header provides security against clickjacking by restricting whether a browser can render a page in a `<frame>`, `<iframe>`, or `<object>`?',
            marks: 10,
            negativeMarks: 0,
            options: [
              { id: 'A', text: 'X-Frame-Options: DENY' },
              { id: 'B', text: 'Access-Control-Allow-Origin: *' },
              { id: 'C', text: 'Cache-Control: no-store' },
              { id: 'D', text: 'Content-Encoding: gzip' },
            ],
            correctOptionId: 'A',
            explanation: 'X-Frame-Options: DENY or frame-ancestors in CSP prohibits iframe embedding, neutralizing clickjacking exploits.',
          },
        ],
      },
    },
  });

  console.log(`Seeded Assessment 1: "${test1.title}" (Code: ${test1.accessCode})`);
  console.log(`Seeded Assessment 2: "${test2.title}" (Code: ${test2.accessCode})`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
