import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, teacherInviteCode } = body;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json({ error: 'Name must be between 2 and 100 characters' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json({ error: 'Password must be between 8 and 72 characters' }, { status: 400 });
    }

    if (role !== undefined && role !== 'TEACHER' && role !== 'STUDENT') {
      return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
    }

    // Public visitors must not be able to self-assign the teacher role.
    // Teacher registration only works when the deployment defines an invite code.
    if (role === 'TEACHER') {
      const expectedInviteCode = process.env.TEACHER_INVITE_CODE;
      if (!expectedInviteCode || teacherInviteCode !== expectedInviteCode) {
        return NextResponse.json(
          { error: 'Teacher registration is disabled or the invite code is invalid.' },
          { status: 403 }
        );
      }
    }

    const assignedRole = role === 'TEACHER' ? Role.TEACHER : Role.STUDENT;

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
