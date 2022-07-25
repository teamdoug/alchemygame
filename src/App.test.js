import { render, screen } from '@testing-library/react';
import { App, mergeArcs, addArc } from './App';

/*
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
*/

test('mergeArcs', () => {
  let arcs = [[0, 0], [2, 3], [2, 3]];
  mergeArcs(arcs, 1);
  expect(arcs).toEqual([[0, 0], [2, 3]]);
});

test('addArc', () => {
  let arcs = [[0, 0], [2, 3]];
  addArc(arcs, [2,3]);
  expect(arcs).toEqual([[0, 0], [2, 3]]);
});