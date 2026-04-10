import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import { $Employee } from './type-alias.freezed.ts';

type EmployeeParams = {
  name: string;
  department: string;
  level: number;
};

@freezed()
class Employee extends $Employee {
  constructor(params: EmployeeParams) {
    super(params);
  }
}

export { Employee };
