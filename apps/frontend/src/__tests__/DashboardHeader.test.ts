import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardHeader from '@/components/DashboardHeader.vue';

describe('DashboardHeader', () => {
  it('renders metric summary', () => {
    const wrapper = mount(DashboardHeader, {
      props: {
        stats: {
          totalEarthquakes: 10,
          largestMagnitude: 6.1,
          averageMagnitude: 3.4,
          significantEvents: 2,
          latestEarthquake: {
            id: 'eq1',
            magnitude: 4.2,
            place: 'California',
            time: Date.now(),
          },
        },
      },
    });
    expect(wrapper.text()).toContain('USGS Earthquake Feed');
    expect(wrapper.text()).toContain('Total Events');
    expect(wrapper.text()).toContain('10');
  });
});
