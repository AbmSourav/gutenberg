/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect, select } from '@wordpress/data';
import { isRTL, __ } from '@wordpress/i18n';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
	formatOutdent,
	formatOutdentRTL,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import OrderedListSettings from '../ordered-list-settings';

const TEMPLATE = [ [ 'core/list-item' ] ];

function useOutdentList( clientId ) {
	const { canOutdent } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId, getBlock } = innerSelect(
				blockEditorStore
			);
			const parentId = getBlockRootClientId( clientId );
			return {
				canOutdent:
					!! parentId &&
					getBlock( parentId ).name === 'core/list-item',
			};
		},
		[ clientId ]
	);
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	return [
		canOutdent,
		useCallback( () => {
			const {
				getBlockRootClientId,
				getBlockAttributes,
				getBlock,
			} = select( blockEditorStore );
			const parentBlockId = getBlockRootClientId( clientId );
			const parentBlockAttributes = getBlockAttributes( parentBlockId );
			// Create a new parent block without the inner blocks.
			const newParentBlock = createBlock(
				'core/list-item',
				parentBlockAttributes
			);
			const { innerBlocks } = getBlock( clientId );
			// Replace the parent block with a new parent block without inner blocks,
			// and make the inner blocks siblings of the parent.
			replaceBlocks(
				[ parentBlockId ],
				[ newParentBlock, ...innerBlocks ]
			);
			// Select the last child of the list being outdent.
			selectionChange( last( innerBlocks ).clientId );
		}, [ clientId ] ),
	];
}

function IndentUI( { clientId } ) {
	const [ canOutdent, outdentList ] = useOutdentList( clientId );
	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				disabled={ ! canOutdent }
				onClick={ outdentList }
			/>
		</>
	);
}

function Edit( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list-item' ],
		template: TEMPLATE,
	} );
	const { ordered, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

	const controls = (
		<BlockControls group="block">
			<ToolbarButton
				icon={ isRTL() ? formatListBulletsRTL : formatListBullets }
				title={ __( 'Unordered' ) }
				describedBy={ __( 'Convert to unordered list' ) }
				isActive={ ordered === false }
				onClick={ () => {
					setAttributes( { ordered: false } );
				} }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatListNumberedRTL : formatListNumbered }
				title={ __( 'Ordered' ) }
				describedBy={ __( 'Convert to ordered list' ) }
				isActive={ ordered === true }
				onClick={ () => {
					setAttributes( { ordered: true } );
				} }
			/>
			<IndentUI clientId={ clientId } />
		</BlockControls>
	);

	return (
		<>
			<TagName
				reversed={ reversed }
				start={ start }
				{ ...innerBlocksProps }
			/>
			{ controls }
			{ ordered && (
				<OrderedListSettings
					setAttributes={ setAttributes }
					ordered={ ordered }
					reversed={ reversed }
					start={ start }
				/>
			) }
		</>
	);
}

export default Edit;
