// Portfolio Data Configuration
const portfolioData = {
  personal: {
    name: "Om Singh",
    title: "Full Stack Developer",
    age: 19,
    profileImage: "assets/images/profile.png",
    social: {
      github: "https://github.com/omsingh02",
      linkedin: "https://linkedin.com/in/omsingh02"
    }
  },

  specializations: [
    {
      name: "Shell scripting",
      icon: "fas fa-terminal",
      description: "Creating efficient automation scripts"
    },
    {
      name: "Desktop Automation",
      icon: "fas fa-robot",
      description: "Automating repetitive desktop tasks"
    },
    {
      name: "CLI Apps",
      icon: "fas fa-code",
      description: "Building command-line applications"
    },
    {
      name: "Full Stack Web Dev",
      icon: "fas fa-globe",
      description: "End-to-end web application development"
    }
  ],

  education: {
    institution: "Galgotias University",
    degree: "BTech Computer Science & Engineering",
    year: "1st year",
    status: "Currently",
    location: "Greater Noida, India"
  },

  technologies: [
    {
      name: "HTML",
      icon: "fab fa-html5",
      color: "#e34c26",
      proficiency: 90
    },
    {
      name: "CSS",
      icon: "fab fa-css3-alt",
      color: "#1572b6",
      proficiency: 85
    },
    {
      name: "JavaScript",
      icon: "fab fa-js-square",
      color: "#f7df1e",
      proficiency: 80
    },
    {
      name: "C",
      icon: "fas fa-code",
      color: "#00599c",
      proficiency: 75
    },
    {
      name: "Python",
      icon: "fab fa-python",
      color: "#3776ab",
      proficiency: 80
    }
  ],

  languages: [
    {
      name: "Hindi",
      level: "Native",
      proficiency: 100
    },
    {
      name: "English",
      level: "Intermediate",
      proficiency: 75
    }
  ],

  stats: {
    age: 19,
    projects: 0,
    technologies: 5,
    experience: "Fresher"
  },

  themes: [
    {
      name: "Forest",
      class: "theme-forest",
      primary: "#10b981",
      icon: "fas fa-tree",
      description: "Nature-inspired green theme"
    },
    {
      name: "Ocean",
      class: "theme-ocean",
      primary: "#14b8a6",
      icon: "fas fa-water",
      description: "Calming ocean blue theme"
    },
    {
      name: "Lavender",
      class: "theme-lavender",
      primary: "#8b5cf6",
      icon: "fas fa-seedling",
      description: "Elegant purple theme"
    },
    {
      name: "Silver",
      class: "theme-silver",
      primary: "#6b7280",
      icon: "fas fa-moon",
      description: "Professional gray theme"
    }
  ],

  projects: [
    // Currently empty - projects will be added here as they are completed
    // Example structure:
    // {
    //   id: 1,
    //   title: "Project Title",
    //   description: "Project description",
    //   image: "assets/images/projects/project1.jpg",
    //   technologies: ["HTML", "CSS", "JavaScript"],
    //   github: "https://github.com/omsingh02/project",
    //   live: "https://project-demo.com",
    //   featured: true,
    //   category: "web"
    // }
  ],

  contact: {
    email: "contact.omsingh@example.com", // Placeholder email
    location: "Greater Noida, India",
    availability: "Open to opportunities"
  },

  // Navigation configuration
  navigation: [
    {
      name: "HOME",
      hash: "home",
      icon: "fas fa-home"
    },
    {
      name: "ABOUT",
      hash: "about",
      icon: "fas fa-user"
    },
    {
      name: "PROJECTS",
      hash: "projects",
      icon: "fas fa-code"
    }
  ],

  // Utility function to get age from birthdate
  calculateAge: function(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Initialize with calculated age
  init: function() {
    // Calculate age from November 26, 2005
    const calculatedAge = this.calculateAge('2005-11-26');
    this.stats.age = calculatedAge;
    this.personal.age = calculatedAge;
  }
};

// Initialize the data
portfolioData.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = portfolioData;
}