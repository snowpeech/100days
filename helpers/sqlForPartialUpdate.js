/**
 * Generate a selective update query based on a request body:
 *
 * - table: where to make the query
 * - items: an object with keys of columns you want to update and values with updated values
 * - key: the column that we query by (e.g. username, handle, id)
 * - id: current record ID
 *
 * Returns object containing a DB query as a string, and array of
 * string values to be updated
 *
 */

function sqlForPartialUpdate(table,itemsObj,key,id) {
    // keep track of item indexes
    // store all the columns we want to update and associate with vals
    let idx = 1;
    let columns = [];
  
    // filter out keys that start with "_" -- we don't want these in DB
    for (let key in itemsObj) {
      if (key.startsWith("_")) {
        delete itemsObj[key]
      }
    }
  
    for (let column in itemsObj) {
      columns.push(`${column}=$${idx}`);
      idx += 1;
    }
  
    // build query
    let cols = columns.join(", ");
    let queryStr = `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx}`;
  
    let values = Object.values(itemsObj);
    values.push(id);
  
    return {queryStr, values};
  }
  
  module.exports = sqlForPartialUpdate;
  