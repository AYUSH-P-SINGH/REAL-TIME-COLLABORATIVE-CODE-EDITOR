import React from 'react';
import { getHashColor } from '../../utils/helpers';

const AvatarGroup = ({ users = [] }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', marginRight: '8px' }}>
        {users.map((user, idx) => {
          const color = getHashColor(user.name);
          return (
            <div
              key={user.id || idx}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #0b0f19',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#000',
                marginLeft: idx > 0 ? '-10px' : '0px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                zIndex: 10 - idx
              }}
              title={user.name}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          );
        })}
      </div>
      {users.length > 0 && (
        <span style={{ fontSize: '0.85rem', color: '#8f9cae', fontWeight: '500' }}>
          {users.length} Active {users.length === 1 ? 'Collaborator' : 'Collaborators'}
        </span>
      )}
    </div>
  );
};

export default AvatarGroup;
export { AvatarGroup };
