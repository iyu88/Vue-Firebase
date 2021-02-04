import moment from 'moment'

/*
export default (time) => {
  const bt = moment(time)
  const ct = moment()
  const r = ct.diff(bt, 'hours')
  return r < 12
}
*/

export default (time, unit, value) => {
  const bt = moment(time)
  const ct = moment()
  const r = ct.diff(bt, unit)
  return r < value
}
