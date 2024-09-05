import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsPhoneNumber("DZ", { message: "phone number must be a valid Algerian phone number" })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;

  //add more fields if needed
}
