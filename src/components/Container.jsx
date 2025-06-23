import styled from 'styled-components';

const Container = styled.div`
  width: 90%;
  max-width: ${({ theme }) => theme.breakpoints.desktop};
  margin: 0 auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 80%;
  }
`;

export default Container;
