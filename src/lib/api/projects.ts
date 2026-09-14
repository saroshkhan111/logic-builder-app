/**
 * Client-side utilities for interacting with the Projects API
 * Usage example for Logic Builder App
 */

import type { Project } from '@prisma/client';

export interface CreateProjectData {
  title?: string;
  problemStatement?: string;
  inputs?: any[];
  outputs?: any[];
  rules?: any[];
  algorithm?: string | null;
  pythonCode?: string | null;
  testCases?: any | null;
  completedSteps?: number;
  isPublic?: boolean;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export class ProjectsAPI {
  /**
   * Fetch all projects for the current user
   */
  static async list(): Promise<Project[]> {
    const response = await fetch('/api/projects');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }
    
    return response.json();
  }

  /**
   * Get a single project by ID
   */
  static async get(id: string): Promise<Project> {
    const response = await fetch(`/api/projects/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project');
    }
    
    return response.json();
  }

  /**
   * Create a new project
   */
  static async create(data: CreateProjectData): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    
    return response.json();
  }

  /**
   * Update an existing project
   */
  static async update(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    
    return response.json();
  }

  /**
   * Delete a project
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }
}

// Example usage in a React component:
/*
import { ProjectsAPI } from '@/lib/api/projects';
import { useState, useEffect } from 'react';

function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProjectsAPI.list()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const newProject = await ProjectsAPI.create({
      title: 'My New Project',
      problemStatement: 'Calculate factorial',
    });
    setProjects([newProject, ...projects]);
  };

  const handleUpdate = async (id: string) => {
    const updated = await ProjectsAPI.update(id, {
      completedSteps: 3,
    });
    setProjects(projects.map(p => p.id === id ? updated : p));
  };

  const handleDelete = async (id: string) => {
    await ProjectsAPI.delete(id);
    setProjects(projects.filter(p => p.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Project</button>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <button onClick={() => handleUpdate(project.id)}>Update</button>
          <button onClick={() => handleDelete(project.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
*/
