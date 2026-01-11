import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../store/slices/categorySlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

const Categories = () => {
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector(state => state.categories);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim()
      };

      console.log('Submitting category data:', categoryData);

      if (selectedCategory) {
        await dispatch(updateCategory({ 
          id: selectedCategory._id, 
          data: categoryData 
        })).unwrap();
      } else {
        const result = await dispatch(createCategory(categoryData)).unwrap();
        console.log('Create category result:', result);
      }
      
      dispatch(showNotification({
        type: 'success',
        message: `Category ${selectedCategory ? 'updated' : 'created'} successfully`
      }));
      
      handleCloseModal();
      dispatch(fetchCategories()); 
    } catch (error) {
      console.error('Category submission error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error?.message || `Failed to ${selectedCategory ? 'update' : 'create'} category`
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    try {
      await dispatch(deleteCategory(category._id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Category deleted successfully' }));
      setShowDeleteDialog(false);
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error.message }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
  };

  if (loading && !categories.length) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Categories</h2>
        <Button onClick={() => setShowModal(true)}>Add Category</Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category._id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <Button size="sm" variant="primary" className="me-2" onClick={() => handleEdit(category)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => {
                  setSelectedCategory(category);
                  setShowDeleteDialog(true);
                }}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCategory ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Enter category name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                placeholder="Enter category description"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    {selectedCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedCategory ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        show={showDeleteDialog}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"?`}
        onConfirm={() => handleDelete(selectedCategory)}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedCategory(null);
        }}
      />
    </div>
  );
};

export default Categories;
