import {Controller,Get, UseGuards,Req, Patch, Body} from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { UpdateUserDto } from 'src/auth/dto';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private userService: UserService){}
  @Get('me')
    getMe(@GetUser() user: User) {
        return user
    }
    @Patch()
    editUser(
      @GetUser('id') userId: number, 
      @Body() dto: UpdateUserDto
    ) {
      return this.userService.editUser(userId, dto);
    }
}
