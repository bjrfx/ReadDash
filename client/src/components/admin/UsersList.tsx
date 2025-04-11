import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, PencilIcon, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  joinDate: string;
  readingLevel: string;
  levelCategory: string;
  quizzesCompleted: number;
  correctPercentage: number;
  lastActive: string;
}

interface UsersListProps {
  users: User[];
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
}

export function UsersList({ users, onViewUser, onEditUser }: UsersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const name = user.displayName || '';
    const email = user.email || '';
    const query = searchQuery.toLowerCase();
    
    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query);
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Add console logging to help debug
  const handleViewClick = (userId: string) => {
    console.log('View user clicked:', userId);
    onViewUser(userId);
  };
  
  const handleEditClick = (userId: string) => {
    console.log('Edit user clicked:', userId);
    onEditUser(userId);
  };
  
  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="font-heading text-lg font-medium">User Management</h3>
          <div className="relative w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Reading Level</th>
              <th className="px-6 py-3">Quizzes</th>
              <th className="px-6 py-3">Last Active</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.photoURL ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.photoURL} 
                          alt={`${user.displayName || 'User'}'s avatar`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium">
                          {(user.displayName || 'U').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium">{user.displayName || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Joined: {user.joinDate || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">{user.email || 'No email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{user.readingLevel || 'N/A'}</div>
                  <div className={`text-xs ${
                    user.levelCategory === 'Advanced' 
                      ? 'text-green-600 dark:text-green-400' 
                      : user.levelCategory === 'Intermediate' 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {user.levelCategory || 'Unclassified'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">{user.quizzesCompleted || 0} completed</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.correctPercentage || 0}% correct
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.lastActive || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      onClick={() => handleViewClick(user.id)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      onClick={() => handleEditClick(user.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <CardContent className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}</span> to{" "}
            <span className="font-medium">
              {indexOfLastUser > filteredUsers.length ? filteredUsers.length : indexOfLastUser}
            </span>{" "}
            of <span className="font-medium">{filteredUsers.length}</span> users
          </p>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            // Logic to show pages around current page
            let pageNum;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage <= 2) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = currentPage - 1 + i;
            }
            
            return (
              <Button 
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
