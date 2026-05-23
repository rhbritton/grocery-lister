import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { faPlus, faBook } from '@fortawesome/free-solid-svg-icons';

import RecipeSearch from '../components/RecipeSearch2.js';
import RecipeItem from '../components/RecipeItem2.js';
import DeleteModal from '../components/DeleteModal.js';
import EmptyState from '../../../components/EmptyState.js';
import FabButton from '../../../components/FabButton.js';
import PageLoader from '../../../components/PageLoader.js';
import BottomNav from '../../../components/BottomNav.js';

function RecipesList(props) {
  const { user } = props;

  const [deleteModalID, setDeleteModalID] = useState(false);

  const { recipes, status } = useSelector(state => state.recipes);

  useEffect(() => {
    props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('mb-20');
  }, [props]);

  return (
    <>
      <FabButton to="/recipes/add" icon={faPlus} label="Add recipe" />

      <main className="page-main pt-0 pb-nav-clear">

      <RecipeSearch userId={user.uid} />
      
      <section className="RecipesList w-full space-y-4">
        {status === 'loading' && !recipes?.length ? (
          <PageLoader message="Loading recipes…" fullScreen={false} />
        ) : recipes && recipes.length ? recipes.map((recipe) => (
          <RecipeItem key={recipe.fbid} recipe={recipe} setDeleteModalID={setDeleteModalID} />
        )) : (
          <EmptyState
            icon={faBook}
            title="No recipes match your search"
            description="Add your recipes to build your grocery lists."
            actionLabel="Add a recipe"
            actionTo="/recipes/add"
          />
        )}
      </section>

      </main>

      <BottomNav active="recipes" />

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </>
  );
}

export default RecipesList;
