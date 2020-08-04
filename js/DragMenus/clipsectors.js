const precision = 1;

let circle_points = (r,used,total,start_angle=0,end_angle=90,points=100) => {
  const x0 = 50;
  const y0 = 50;
  let results = [];
  const angle_width = end_angle - start_angle;
  const total_angle = (used/total) * (Math.PI / 2) * (angle_width / 90);
  for (let i=0; i <= points; i++) {
    let x = x0 + r * Math.cos(total_angle * i / points);
    let y = y0 + r * Math.sin(-1 * total_angle * i / points);
    results.push(`${x.toFixed(precision)}% ${y.toFixed(precision)}%`)
  }
  return results;
};

let point_for_used = (r,used,total,start_angle=0,end_angle=90) => {
  const x0 = 50;
  const y0 = 50;
  const angle_width = end_angle - start_angle;
  const total_angle = (used/total) * (Math.PI / 2) * (angle_width / 90);
  let x = x0 + r * Math.cos(total_angle);
  let y = y0 + r * Math.sin(-1 * total_angle);
  return {x,y};
}

let generate_clip_path = (inner_r_ratio,outer_r_ratio,used=1,total=1,start_angle=0,end_angle=90,points=10) => {
  let inner_r = (inner_r_ratio*50);
  let outer_r = (outer_r_ratio*50);
  let {x: inner_r_x, y: inner_r_y } = point_for_used(inner_r,used,total,start_angle,end_angle);
  return `polygon(${(50 + inner_r).toFixed(precision)}% 50%, ${(50+outer_r).toFixed(precision)}% 50%, ${circle_points(outer_r,used,total,start_angle,end_angle,points).join(',')}, ${inner_r_x.toFixed(precision)}% ${inner_r_y.toFixed(precision)}%, ${circle_points(inner_r,used,total,start_angle,end_angle,points).reverse().join(',')})`;
}


export { generate_clip_path };