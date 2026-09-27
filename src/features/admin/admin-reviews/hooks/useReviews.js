import { useState, useCallback } from 'react';
import { mockReviews } from '../services/reviewService';

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useReviews = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modales
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviews, setReviews] = useState(mockReviews);

  // Filtrado por búsqueda y estado
  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = rev.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rev.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rev.comentario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || rev.estado.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Switch de Estado
  const handleToggleStatus = useCallback(async (id) => {
    await delay();
    setReviews(prev =>
      prev.map(item =>
        item.id === id ? { ...item, estado: item.estado === 'Activo' ? 'Inactivo' : 'Activo' } : item
      )
    );
  }, []);

  const handleOpenDetail = (review) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  return {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    currentPage,
    totalPages,
    handlePageChange,
    isDetailOpen,
    setIsDetailOpen,
    selectedReview,
    currentReviews,
    totalReviewsCount: filteredReviews.length,
    handleToggleStatus,
    handleOpenDetail
  };
};
