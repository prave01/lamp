import { IsString } from "class-validator";

export class CreateIdeaDtop {
  @IsString()
  readonly title: string;
}
