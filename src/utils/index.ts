export * as objectUtils from './object.utils';
export * as stringUtils from './string.utils';
export * as dateUtils from './date.utils';
export * as typeUtils from './type.utils';
export * as generalUtils from './general.utils';

import * as objectUtils from './object.utils';
import * as stringUtils from './string.utils';
import * as dateUtils from './date.utils';
import * as typeUtils from './type.utils';
import * as generalUtils from './general.utils';

export const utils = {
  ...objectUtils,
  ...stringUtils,
  ...dateUtils,
  ...typeUtils,
  ...generalUtils,
}; 