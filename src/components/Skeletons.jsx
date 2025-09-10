import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Card, CardContent } from '@mui/material';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const Block = styled.div`
  width: 100%;
  height: ${({ h }) => h || 16}px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.16), rgba(255,255,255,0.06));
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

const Rect = styled(Block)`
  height: ${({ h }) => h || 160}px;
  border-radius: 16px;
`;

export const EventCardSkeleton = () => (
  <Card sx={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', overflow: 'hidden' }}>
    <Rect h={220} />
    <CardContent sx={{ p: 1.5 }}>
      <Block h={18} />
      <div style={{ height: 10 }} />
      <Block />
      <div style={{ height: 6 }} />
      <Block style={{ width: '60%' }} />
    </CardContent>
  </Card>
);

export const GalleryTileSkeleton = () => (
  <Rect h={0} style={{ aspectRatio: '1 / 1' }} />
);

export const SliderSkeleton = ({ count = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Rect key={i} h={0} style={{ paddingTop: '56.25%' }} />
    ))}
  </div>
);

export const VideoGridSkeleton = ({ count = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: '2rem' }}>
    {Array.from({ length: count }).map((_, i) => (
      <Rect key={i} h={0} style={{ paddingTop: '56.25%' }} />
    ))}
  </div>
);

export const CartItemSkeleton = () => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '1rem',
    padding: '0.75rem 1rem', marginBottom: '1rem', backgroundColor: '#111', borderRadius: 4,
  }}>
    <Rect h={50} style={{ width: 50 }} />
    <div>
      <Block h={14} />
      <div style={{ height: 8 }} />
      <Block h={12} style={{ width: '60%' }} />
    </div>
    <Block h={28} style={{ width: 60, borderRadius: 6 }} />
    <Block h={18} style={{ width: 40 }} />
    <Block h={28} style={{ width: 80, borderRadius: 6 }} />
  </div>
);

export const FormFieldSkeleton = ({ lines = 1 }) => (
  <div style={{ width: '100%' }}>
    <Block h={12} style={{ width: '40%', marginBottom: 8 }} />
    {Array.from({ length: lines }).map((_, i) => (
      <Block key={i} h={38} style={{ borderRadius: 10, marginBottom: 8, background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))' }} />
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', width: '100%', maxWidth: 400, margin: '0 auto' }}>
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <Block h={44} style={{ borderRadius: 10 }} />
  </div>
);

export default { EventCardSkeleton, GalleryTileSkeleton, SliderSkeleton, VideoGridSkeleton, CartItemSkeleton, FormFieldSkeleton, FormSkeleton };
