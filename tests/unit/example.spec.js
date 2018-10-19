import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import DSTCalculator from '@/DSTCalculator'
/*
describe('DSTViewer.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(HelloWorld, {
      propsData: { msg }
    })
    expect(wrapper.text()).to.include(msg)
  })
})
*/

describe('DSTCalculator.js', () => {
  it('detectsSummerTime', () => {
    let calculator = new DSTCalculator.DSTCalculator(
      47.3667,
      8.55,
      2,
      { day: 22, month: 3},
      { day: 22, month: 10},
      1
    );

    expect(calculator.isDst(new Date("2018-01-01"))).to.eq(false)
    expect(calculator.isDst(new Date("2018-08-01"))).to.eq(true)
  })
})