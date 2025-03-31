const StatsCard = ({ title, value, icon, color, isCurrency }) => {
  const formattedValue = isCurrency 
    ? new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }).format(value)
    : value;

  return (
    <div className={`card bg-${color} text-white h-100`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title">{title}</h6>
            <h3 className="mb-0">{formattedValue}</h3>
          </div>
          <div className="fs-1 opacity-50">
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
