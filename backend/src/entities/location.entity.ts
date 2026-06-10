import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

export enum LocationType {
  BUILDING = 'building',
  FLOOR = 'floor',
  ROOM = 'room',
  RACK = 'rack',
  OTHER = 'other',
}

@Entity()
export class Location {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 256 })
  name: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.OTHER })
  type: LocationType;

  @Column({ nullable: true })
  parentId: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Location;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
