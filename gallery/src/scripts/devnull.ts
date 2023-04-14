export default function devnull(callback: Function): any {
  const logger = console.log
  console.log = () => {}
  const retval = callback()
  console.log = logger
  return retval
}
