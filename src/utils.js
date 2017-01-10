// external dependencies
import get from 'lodash/fp/get';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import set from 'lodash/fp/set';

// constants
import {
  CHARTS_UNABLE_TO_BE_MIXED
} from './constants';

/**
 * @module utils
 */

/**
 * @function getDefaultSeries
 * 
 * @description
 * get the series in the config or an empty array
 * 
 * @param {Object} config config to retrieve series from
 * @returns {Array<Object>} series for the given config
 */
export const getDefaultSeries = (config) => {
  return get('series', config) || [];
};

/**
 * @function getKeyWithProperty
 * 
 * @description
 * get the key namespaced
 * 
 * @param {string} key key to namespace
 * @param {string} namespace namespace of key
 * @returns {string} complete key
 */
export const getNamespacedKey = (key, namespace) => {
  return `${namespace}.${key}`;
};

/**
 * @function canCombineChartTypes
 *
 * @description
 * does the chart types in series allow for combination with other chart types
 *
 * @param {Array<Object>} series series data sets
 * @returns {boolean} does the series allow for combination of all the charts added
 */
export const canCombineChartTypes = (series) => {
  const length = series.length;

  let index = -1;

  while (++index < length) {
    if (!!~CHARTS_UNABLE_TO_BE_MIXED.indexOf(series[index].type)) {
      return false;
    }
  }

  return true;
};

/**
 * @function createPropertyConvenienceMethod
 *
 * @description
 * create a convenience property for the class
 *
 * @param {string} property property name
 * @returns {Function} method to assign to class at property
 */
export const createPropertyConvenienceMethod = (property) => {
  return function(...args) {
    if (!args.length) {
      return this.get(property);
    }

    const [
      subKey,
      value
    ] = args;

    if (isPlainObject(subKey)) {
      const cleanArgs = Object.keys(subKey).reduce((updatedObject, keyWithoutProperty) => {
        updatedObject[getNamespacedKey(keyWithoutProperty, property)] = subKey[keyWithoutProperty];

        return updatedObject;
      }, {});

      return this.set(cleanArgs);
    }

    if (isArray(subKey)) {
      return this.set(property, subKey);
    }

    const key = getNamespacedKey(subKey, property);

    return args.length === 1 ? this.get(key) : this.set(key, value);
  };
};

/**
 * @function isMixedChartType
 *
 * @description
 * is the series a mixture of chart types or a single type
 *
 * @param {Array<Object>} series series data sets
 * @returns {boolean} are multiple chart types present
 */
export const isMixedChartType = (series) => {
  const length = series.length;

  let index = -1,
      currentType,
      type;

  while (++index < length) {
    currentType = series[index].type;

    if (currentType !== type) {
      if (isString(type)) {
        return true;
      }

      type = currentType;
    }
  }

  return false;
};

/**
 * @function getNewChartSeries
 *
 * @description
 * return the new series sets augmented with the chart type
 *
 * @param {Array<Object>} series series data sets
 * @param {string} type the type of chart
 * @returns {Array<Object>} series augmented with chart type
 */
export const getNewChartSeries = (series, type) => {
  return series.map((seriesInstance) => {
    return seriesInstance.type ? seriesInstance : {
        ...seriesInstance,
        type
      };
  });
};

/**
 * @function getNewConfigFromObject
 *
 * @description
 * get a new configuration object based on iteratively setting new values at each key
 *
 * @param {Object} currentConfig configuration of the given instance
 * @param {Object} object key => value pairs to assign to the config
 * @returns {Object} new configuration object
 */
export const getNewConfigFromObject = (currentConfig, object) => {
  return Object.keys(object).reduce((config, key) => {
    return set(key, object[key], config);
  }, currentConfig);
};

/**
 * @function getNewConfigWithSeries
 *
 * @description
 * get a new configuration with an series concatenated with existing series
 *
 * @param {Object} config current configuration of the given instance
 * @param {string} type the type of chart
 * @param {Array<Object>} series series data sets
 * @returns {Object} new configuration object
 */
export const getNewConfigWithSeries = (config, type, series) => {
  const updatedSeries = [
    ...getDefaultSeries(config),
    ...series
  ];

  if (isMixedChartType(updatedSeries) && !canCombineChartTypes(updatedSeries)) {
    throw new TypeError('Cannot combine these chart types.');
  }

  return set('series', updatedSeries, config);
};

/**
 * @function toString
 *
 * @description
 * stringify the configuration object in a formatted way
 *
 * @param {Object} config current configuration of the given instance
 * @returns {string} stringified configuration
 */
export const toString = (config) => {
  return JSON.stringify(config, null, 2);
};
