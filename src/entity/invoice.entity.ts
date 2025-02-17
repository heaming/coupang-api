import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

@Entity({name: 'Invoice'})
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({description: '송장번호'})
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @ApiProperty({description: '택배사코드'})
  @Column({ name: 'delivery_company_code'})
  deliveryCompanyCode: string;

  @ApiProperty({description: '사용일'})
  @Column({ name: 'used_at'})
  @IsOptional()
  usedAt: Date;

  @ApiProperty({description: '사용일'})
  @Column({ name: 'created_at'})
  @CreateDateColumn()
  createdAt: Date;
}