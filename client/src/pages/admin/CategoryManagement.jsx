import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Modal } from 'react-bootstrap';
import { createCategory, updateCategory, deleteCategory, fetchCategories } from '../../store/slices/categorySlice';
import { showNotification } from '../../store/slices/notificationSlice';
import CategoryForm from '../../components/admin/CategoryForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector(state => state.category); // Fix selector
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories()); // Add this effect to fetch categories
  }, [dispatch]);

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      console.log('Submitting category form:', formData);
      
      if (editingCategory) {
        await dispatch(updateCategory({ id: editingCategory._id, data: formData })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Category updated successfully' }));
      } else {
        await dispatch(createCategory(formData)).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Category created successfully' }));
      }
      setShowForm(false);
      setEditingCategory(null);
      
      dispatch(fetchCategories());
    } catch (error) {
      console.error('Category submission error:', error);
      dispatch(showNotification({ type: 'error', message: error.message || 'Operation failed' }));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCategory(categoryToDelete._id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Category deleted successfully' }));
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error.message }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Category Management</h2>
        <Button onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-2"></i>
          Add Category
        </Button>
      </div>

      <div className="row g-4">
        {categories.map(category => (
          <div key={category._id} className="col-md-4">
            <Card>
            
              <Card.Body>
                <Card.Title>{category.name}</Card.Title>
                <Card.Text>{category.description}</Card.Text>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setCategoryToDelete(category);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Category Form Modal */}
      <Modal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            loading={formLoading}
          />
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
      />
    </div>
  );
};

export default CategoryManagement;
