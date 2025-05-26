export { DateUtil } from './date.util';
export { _ } from './_utils'; // Re-export _ from _utils.ts

import { DateUtil } from './date.util'; // Import the class
import { _ } from './_utils'; // Import _ for the utils object

export const utils = {
  DateUtil, // Export the class directly
  _, // Export the _ object
};
