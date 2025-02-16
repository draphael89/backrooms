'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { Node, Link } from '@/lib/types';

// Extend Node type to include D3 simulation properties
interface SimNode extends Node, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
}

// Extend Link type to include D3 simulation properties
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
}

interface Props {
  nodes: Node[];
  links: Link[];
  onNodeClick?: (node: Node) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function NetworkGraph({
  nodes,
  links,
  onNodeClick,
  width = 600,
  height = 400,
  className = ''
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((node: SimNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Convert nodes and links to simulation types
    const simNodes: SimNode[] = nodes.map(node => ({ ...node }));
    const simLinks: SimLink[] = links.map(link => ({
      source: simNodes.find(n => n.id === link.source) as SimNode,
      target: simNodes.find(n => n.id === link.target) as SimNode
    }));

    // Create force simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create container for zoom/pan
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Draw links
    const link = container
      .append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Draw nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (_, d) => handleNodeClick(d))
      .call(drag(simulation) as any); // Type assertion needed due to D3 typing limitations

    // Add circles for nodes
    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.current ? '#4CAF50' : d.type === 'choice' ? '#FFA726' : '#1E88E5')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    node.append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .text(d => d.label)
      .attr('fill', '#fff')
      .attr('font-size', '12px');

    // Add tooltips
    if (tooltipRef.current) {
      const tooltip = d3.select(tooltipRef.current);
      
      node
        .on('mouseover', (event, d) => {
          tooltip
            .style('opacity', 1)
            .html(`
              <div class="font-medium">${d.label}</div>
              <div class="text-sm opacity-75">${d.content}</div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });
    }

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x!)
        .attr('y1', d => d.source.y!)
        .attr('x2', d => d.target.x!)
        .attr('y2', d => d.target.y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, handleNodeClick]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-gray-800 rounded-lg"
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 bg-gray-900 text-white p-2 rounded shadow-lg transition-opacity duration-200"
      />
    </div>
  );
}

// Drag behavior for nodes
function drag(simulation: d3.Simulation<SimNode, SimLink>) {
  function dragstarted(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: d3.D3DragEvent<Element, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag<Element, SimNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
} 