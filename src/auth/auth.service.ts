import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // signup function
  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
        },
      });

      delete user.password;

      return user;
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'credential taken',
          );
        }
      }
      throw error;
    }
  }

  // login function
  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      }});
    // if user does not exist throw exception
    if (!user)
      throw new ForbiddenException(
        'Credentials incorrect',
      );

    // compare password
    const pwMatches = await argon.verify(
      user.password,
      dto.password,
    );

    // if password incorrect throw exception
    if (!pwMatches)
      throw new ForbiddenException(
        'Credentials incorrect',
      );

    // send back the user
    delete user.password;

    return this.signToken(user.id, user.email);
  }

  // signToken function
  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string, refresh_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const accessToken = await this.jwt.signAsync(
      payload,
      {
        expiresIn: '15m',
        secret: secret,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      payload,
      {
        expiresIn: '7d',
        secret: secret,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // refreshToken function
  async refreshToken(refreshToken: string): Promise<{ access_token: string, refresh_token: string }> {
    try { 
      const secret = this.config.get('JWT_SECRET');
      console.log('Verifying refresh token:', refreshToken);
      const payload = await this.jwt.verifyAsync(refreshToken, { secret });
      
      console.log('Payload:', payload);
  
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });
  
      if (!user) {
        throw new ForbiddenException('User no longer exists');
      }
  
      return this.signToken(user.id, user.email);
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new ForbiddenException('Invalid token');
    }
  }
  
}
