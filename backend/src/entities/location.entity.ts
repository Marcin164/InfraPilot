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

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', nullable: true })
  planPath: string | null;

  @Column({ type: 'varchar', nullable: true })
  planMimetype: string | null;

  @Column({ type: 'varchar', nullable: true })
  planOriginalName: string | null;

  /**
   * Normalized 0-1 position of this location (room/rack) within its nearest
   * ancestor floor's plan image. Only meaningful for type ROOM/RACK.
   */
  @Column({ type: 'double precision', nullable: true })
  planX: number | null;

  @Column({ type: 'double precision', nullable: true })
  planY: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
